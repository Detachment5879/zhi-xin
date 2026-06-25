"""
KSTAR Orchestrator — 循环调度中心

串联全部 Agent，实现完整 KSTAR 闭环
K(前测) → S+T(目标) → A(资源) → R(后测) → pass/retry/fuse

规则：
- 前测 ≥ 80% → SKIP（0 API 费）
- 后测 ≥ 80% → PASS
- 后测 < 80% 第1轮 → RETRY
- 后测 < 80% 第2轮 → FUSE
- 前置知识点未通过 → 目标降级为前置
"""

import random
from app.agents.diagnostic import diagnostic_agent
from app.agents.gap_analyzer import gap_analyzer
from app.agents.resource_gen import resource_generator
from app.agents.review_agent import review_agent, ReviewContext
from app.agents.reflection import reflection_evaluator
from app.database import select, insert, update

PASS_THRESHOLD = 0.80
MAX_CYCLES = 3


async def _get_knowledge_point(kp_id: str) -> dict:
    rows = await select("knowledge_points", filters=f"id=eq.{kp_id}&limit=1")
    return rows[0] if rows else {"name": "未知", "difficulty": 1}


async def _get_session(session_id: str) -> dict:
    rows = await select("learning_sessions", filters=f"id=eq.{session_id}&limit=1")
    if not rows:
        raise ValueError(f"Session {session_id} 不存在")
    return rows[0]


async def _get_student_profile(student_id: str) -> dict:
    rows = await select("student_profiles", filters=f"user_id=eq.{student_id}&limit=1")
    if rows:
        return rows[0]
    return {
        "cognitive_style": "reading",
        "learning_goal": "basic",
        "explanation_style": "balanced",
    }


async def _count_sessions(student_id: str, kp_id: str) -> int:
    rows = await select("learning_sessions", filters=f"student_id=eq.{student_id}&kp_id=eq.{kp_id}&select=id")
    return len(rows)


async def _fetch_questions(kp_id: str, count: int = 5, exclude_ids: list[str] | None = None) -> list[dict]:
    exclude = exclude_ids or []
    all_qs = await select("questions", filters=f"kp_id=eq.{kp_id}&limit=20")
    available = [q for q in all_qs if q["id"] not in exclude]
    return random.sample(available, min(count, len(available)))


async def _check_prerequisite(descendant_kp_id: str) -> str | None:
    """
    检查前置知识点是否已掌握。
    如果当前知识点有前置，且前置在 learning_sessions 中没有 final_decision='pass' 的记录，
    则返回该前置知识点 ID（目标应降级）。
    """
    kp = await _get_knowledge_point(descendant_kp_id)
    prereqs = kp.get("prerequisites") or []

    if not prereqs:
        return None

    for pre_id in prereqs:
        rows = await select("learning_sessions", filters=f"kp_id=eq.{pre_id}&final_decision=eq.pass&select=id&limit=1")
        if not rows:
            return pre_id  # 前置未通过，返回应该先学的知识点 ID

    return None


async def _score_answers(question_ids: list[str], answers: list[dict]) -> tuple[float, list[dict]]:
    """评分：比对答案，返回 (正确率, 详细记录)"""
    if not question_ids:
        return 0, []

    ids_str = ",".join(question_ids)
    rows = await select("questions", filters=f"id=in.({ids_str})&select=id,correct_answer")
    q_map = {q["id"]: q for q in rows}

    correct = 0
    records = []
    for a in answers:
        q = q_map.get(a["question_id"])
        is_correct = q and a["answer"].strip().lower() == q["correct_answer"].strip().lower()
        if is_correct:
            correct += 1
        records.append({"id": a["question_id"], "correct": is_correct})

    accuracy = correct / len(answers) if answers else 0
    return accuracy, records


# ==================== Orchestrator ====================


class Orchestrator:
    """KSTAR 循环调度器"""

    # ═══════════════ K 阶段：开始学习 ═══════════════

    async def start_cycle(self, student_id: str, kp_id: str) -> dict:
        kp = await _get_knowledge_point(kp_id)
        cycle_num = await _count_sessions(student_id, kp_id) + 1

        # 前置检查
        fallback_kp = await _check_prerequisite(kp_id)
        if fallback_kp:
            fallback = await _get_knowledge_point(fallback_kp)
            return {
                "action": "redirect",
                "message": f"前置知识点「{fallback['name']}」未掌握，建议先学前置",
                "redirect_kp_id": fallback_kp,
            }

        if cycle_num > MAX_CYCLES:
            return {"action": "fuse", "message": f"已达到最大循环次数 {MAX_CYCLES}"}

        # 抽题（只排除当前 session 已用的，不跨 session 累计排除）
        questions = await _fetch_questions(kp_id, 3)

        # 创建 session
        session = await insert("learning_sessions", {
            "student_id": student_id,
            "kp_id": kp_id,
            "cycle_number": cycle_num,
        })

        return {
            "session_id": session[0]["id"],
            "kp_name": kp["name"],
            "cycle_num": cycle_num,
            "phase": "pre_test",
            "questions": questions,
        }

    # ═══════════════ K→S：提交前测 ═══════════════

    async def submit_pre_test(self, session_id: str, answers: list[dict]) -> dict:
        session = await _get_session(session_id)
        q_ids = [a["question_id"] for a in answers]
        accuracy, records = await _score_answers(q_ids, answers)

        await update("learning_sessions", f"id=eq.{session_id}", {
            "pre_test_score": accuracy,
            "pre_test_detail": records,
        })

        # ≥80% → SKIP
        if accuracy >= PASS_THRESHOLD:
            await update("learning_sessions", f"id=eq.{session_id}", {
                "final_decision": "skip",
            })
            return {
                "phase": "complete",
                "action": "skip",
                "accuracy": accuracy,
                "message": f"正确率 {accuracy*100:.0f}%，已掌握，跳过",
            }

        # 诊断
        kp = await _get_knowledge_point(session["kp_id"])
        diagnosis = await diagnostic_agent.run(kp["name"], records, accuracy, "full")

        return {
            "phase": "target",
            "action": "continue",
            "accuracy": accuracy,
            "diagnosis": diagnosis,
            "records": records,
            "kp_id": session["kp_id"],
        }

    # ═══════════════ S+T：锁定目标 ═══════════════

    async def generate_target(self, session_id: str, course_goal: str = "", diagnosis: str = "") -> dict:
        session = await _get_session(session_id)
        kp = await _get_knowledge_point(session["kp_id"])

        target = await gap_analyzer.run(kp["name"], diagnosis, course_goal or f"掌握{kp['name']}")

        await update("learning_sessions", f"id=eq.{session_id}", {"target": target})

        return {"phase": "resource", "kp_name": kp["name"], "target": target}

    # ═══════════════ A：生成资源 ═══════════════

    async def generate_resource(self, session_id: str) -> dict:
        session = await _get_session(session_id)
        profile = await _get_student_profile(session["student_id"])
        kp = await _get_knowledge_point(session["kp_id"])

        result = await resource_generator.run(
            kp_name=kp["name"],
            cognitive_style=profile.get("cognitive_style", "reading"),
            learning_goal=profile.get("learning_goal", "basic"),
            explanation_style=profile.get("explanation_style", "balanced"),
        )

        # ReviewAgent 审核
        ctx = ReviewContext(target_difficulty=kp.get("difficulty", 3))
        review = review_agent.review(result["content"], ctx)

        retry_count = 0
        if not review.passed:
            retry_count = 1
            result = await resource_generator.run(
                kp_name=kp["name"],
                cognitive_style=profile.get("cognitive_style", "reading"),
                learning_goal=profile.get("learning_goal", "basic"),
                explanation_style="balanced",
            )
            review = review_agent.review(result["content"], ctx)

        # 存审核记录
        await insert("resource_generations", {
            "session_id": session_id,
            "kp_id": session["kp_id"],
            "resource_type": result["type"],
            "content": result["content"],
            "review_score": review.score,
            "review_details": [{"rule": c.rule, "passed": c.passed, "detail": c.detail} for c in review.checks],
            "review_passed": review.passed,
            "retry_count": retry_count,
        })

        return {
            "phase": "learning",
            "resource_type": result["type"],
            "label": result["label"],
            "content": result["content"],
            "review": {
                "passed": review.passed,
                "score": review.score,
                "checks": [{"rule": c.rule, "passed": c.passed, "detail": c.detail} for c in review.checks],
                "suggestions": review.suggestions,
            },
        }

    # ═══════════════ R：后测 ═══════════════

    async def fetch_post_test(self, session_id: str) -> dict:
        """获取后测题目（3题，排除前测做过的）"""
        session = await _get_session(session_id)
        pre_test = session.get("pre_test_detail") or []
        exclude = [r.get("id", "") for r in pre_test if isinstance(r, dict)]
        questions = await _fetch_questions(session["kp_id"], 3, exclude)
        return {"questions": questions}

    async def submit_post_test(self, session_id: str, answers: list[dict]) -> dict:
        session = await _get_session(session_id)
        q_ids = [a["question_id"] for a in answers]
        accuracy, records = await _score_answers(q_ids, answers)

        kp = await _get_knowledge_point(session["kp_id"])
        result = await reflection_evaluator.run(kp["name"], accuracy, records, session["cycle_number"])

        await update("learning_sessions", f"id=eq.{session_id}", {
            "post_test_score": accuracy,
            "post_test_detail": records,
            "final_decision": result["decision"],
        })

        return {
            "phase": "complete",
            "decision": result["decision"],
            "accuracy": accuracy,
            "reflection": result["reflection"],
            "cycle_num": session["cycle_number"],
            "next_action": {
                "pass": "进入下一个知识点",
                "retry": f"再学一轮（{session['cycle_number'] + 1}/{MAX_CYCLES}）",
                "fuse": "建议求助老师",
            }.get(result["decision"], ""),
        }


orchestrator = Orchestrator()
