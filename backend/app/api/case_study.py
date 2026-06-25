"""案例实战 API — 数据库驱动的分支剧情学习"""
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.database import select, insert, update
from app.services.llm_client import async_llm

router = APIRouter(prefix="/api/case-study", tags=["案例实战"])


# ==================== 类型 ====================

class StartRequest(BaseModel):
    student_id: str = Field(default="00000000-0000-0000-0000-000000000005")
    scenario_id: str

class ChooseRequest(BaseModel):
    session_id: str
    choice: str  # "A" / "B" / "C" / "D"


# ==================== 辅助 ====================

def _parse_llm_response(text: str) -> tuple[str, list[dict], str | None]:
    """
    解析 LLM 返回：
    返回 (narrative, options, correct_answer)
    options: [{"id": "A", "text": "..."}, ...]
    correct_answer: "A"/"B"/"C"/"D" or None
    """
    # 提取正确答案标记 <!-- correct:X -->
    correct_match = re.search(r"<!--\s*correct:\s*([A-D])\s*-->", text)
    correct = correct_match.group(1) if correct_match else None

    # 移除标记，得到纯文本
    narrative = re.sub(r"<!--\s*correct:\s*[A-D]\s*-->", "", text).strip()

    # 提取选项 [A] ... [B] ... [C] ... [D] ...
    option_pattern = re.compile(r"\[([A-D])\]\s*(.*?)(?=\[(?:[A-D])\]|$)", re.DOTALL)
    options = []
    for match in option_pattern.finditer(narrative):
        opt_id = match.group(1)
        opt_text = match.group(2).strip()
        # 去掉末尾的换行和空白
        opt_text = re.sub(r"\s+", " ", opt_text).strip()
        options.append({"id": opt_id, "text": opt_text})

    # 移除选项部分，得到纯叙事
    if options:
        # 找到第一个 [A] 的位置，之前的是叙事
        first_opt_pos = narrative.find(f"[{options[0]['id']}]")
        if first_opt_pos > 0:
            narrative = narrative[:first_opt_pos].strip()

    return narrative, options, correct


def _build_user_message(conversation: list[dict], choice: str | None = None) -> str:
    """把对话历史拼成 LLM 可理解的 user message"""
    if choice:
        return f"学生选择了：{choice}"
    else:
        return "请开始这个场景，给出第一段剧情和选项。"


async def _call_llm_and_parse(scenario: dict, conversation: list[dict], choice: str | None = None):
    """调 LLM 并解析返回"""
    # 把近期对话历史给 LLM 作为上下文
    recent = conversation[-8:] if len(conversation) > 8 else conversation  # 最多 8 条上下文
    history_text = "\n".join(
        f"{'系统' if m['role']=='system' else '学生'}: {m.get('content','')[:200]}"
        for m in recent
    )

    user_msg = f"""对话历史：
{history_text}

---
{_build_user_message(conversation, choice)}

请按照格式输出：先一段叙事（200字内），然后 [A] [B] [C] [D] 选项，末尾用 <!-- correct:X --> 标记正确答案。"""

    for attempt in range(2):
        raw = await async_llm.chat(
            system_prompt=scenario["system_prompt"],
            user_message=user_msg,
            temperature=0.7,
            max_tokens=1024,
        )
        narrative, options, correct = _parse_llm_response(raw)
        if options and len(options) >= 2:
            return narrative, options, correct
        # 重试
        user_msg += "\n\n（请严格按照格式输出：叙事 + [A]选项 [B]选项 [C]选项 + <!-- correct:X -->）"

    raise HTTPException(status_code=502, detail="LLM 两次都未按格式返回，请稍后重试")


# ==================== 接口 ====================

@router.get("/scenarios")
async def list_scenarios():
    """获取所有已发布的场景"""
    try:
        rows = await select(
            "case_study_scenarios",
            filters="status=eq.published&select=id,slug,title,difficulty,description,max_steps,knowledge_points"
        )
        # 解析 knowledge_points 对应的名字
        for r in rows:
            kp_ids = r.get("knowledge_points") or []
            if kp_ids and len(kp_ids) > 0:
                try:
                    kp_rows = await select(
                        "knowledge_points",
                        filters=f"id=in.({','.join(kp_ids)})&select=id,name"
                    )
                    r["knowledge_point_names"] = [kp["name"] for kp in kp_rows]
                except Exception:
                    r["knowledge_point_names"] = []
            else:
                r["knowledge_point_names"] = []

        return {"scenarios": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session")
async def get_session(student_id: str = "00000000-0000-0000-0000-000000000005"):
    """检查是否有未完成的会话（用于页面恢复）"""
    try:
        sessions = await select(
            "case_study_sessions",
            filters=f"student_id=eq.{student_id}&status=eq.in_progress&order=started_at.desc&limit=1"
        )
        if not sessions:
            return {"has_active": False}

        s = sessions[0]
        # 查场景标题
        scenario_rows = await select(
            "case_study_scenarios",
            filters=f"id=eq.{s['scenario_id']}&select=title,max_steps"
        )
        title = scenario_rows[0]["title"] if scenario_rows else "未知场景"
        max_steps = scenario_rows[0]["max_steps"] if scenario_rows else 8

        return {
            "has_active": True,
            "session_id": s["id"],
            "title": title,
            "max_steps": max_steps,
            "current_step": s.get("current_step", 0),
            "correct_count": s.get("correct_count", 0),
            "conversation": s.get("conversation", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_case(req: StartRequest):
    """开始一个新场景"""
    try:
        # 1. 查场景定义
        rows = await select("case_study_scenarios", filters=f"id=eq.{req.scenario_id}&limit=1")
        if not rows:
            raise HTTPException(status_code=404, detail="场景不存在")
        scenario = rows[0]

        if scenario.get("status") != "published":
            raise HTTPException(status_code=400, detail="该场景未发布")

        # 2. 调 LLM 生成开场白
        narrative, options, correct = await _call_llm_and_parse(scenario, [], None)

        # 3. 创建会话
        first_message = {
            "role": "system",
            "content": scenario.get("role_play", ""),
        }
        first_narrative_msg = {
            "role": "system",
            "content": narrative,
            "options": options,
        }
        conversation = [first_message, first_narrative_msg]

        session = await insert("case_study_sessions", {
            "student_id": req.student_id,
            "scenario_id": req.scenario_id,
            "current_step": 1,
            "conversation": conversation,
        })

        return {
            "session_id": session[0]["id"],
            "title": scenario["title"],
            "max_steps": scenario["max_steps"],
            "narrative": narrative,
            "options": options,
            "step": 1,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/choose")
async def make_choice(req: ChooseRequest):
    """学生做了选择，推进剧情"""
    try:
        # 1. 查会话
        rows = await select("case_study_sessions", filters=f"id=eq.{req.session_id}&limit=1")
        if not rows:
            raise HTTPException(status_code=404, detail="会话不存在")
        session = rows[0]

        if session.get("status") != "in_progress":
            raise HTTPException(status_code=400, detail="该会话已结束")

        # 2. 查场景
        scenario_rows = await select("case_study_scenarios", filters=f"id=eq.{session['scenario_id']}&limit=1")
        scenario = scenario_rows[0]

        # 3. 调 LLM 推进剧情
        conversation = session.get("conversation") or []
        if isinstance(conversation, str):
            conversation = json.loads(conversation)

        narrative, options, correct = await _call_llm_and_parse(scenario, conversation, req.choice)

        # 4. 记录本次选择
        step = session.get("current_step", 0) + 1
        is_correct = (correct == req.choice) if correct else None
        correct_count = session.get("correct_count", 0)

        # 添加学生选择到对话
        conversation.append({
            "role": "user",
            "content": req.choice,
            "evaluation": "correct" if is_correct else ("wrong" if is_correct is False else "neutral"),
        })

        if is_correct:
            correct_count += 1

        # 添加系统回复到对话
        conversation.append({
            "role": "system",
            "content": narrative,
            "options": options,
            "correct_answer": correct,
        })

        # 记录决策
        decisions = session.get("decisions") or []
        if isinstance(decisions, str):
            decisions = json.loads(decisions)
        decisions.append({
            "step": step,
            "choice": req.choice,
            "correct": is_correct,
            "correct_answer": correct,
        })

        max_steps = scenario.get("max_steps", 8)
        concluded = step >= max_steps

        # 5. 更新会话
        update_data = {
            "current_step": step,
            "conversation": conversation,
            "decisions": decisions,
            "correct_count": correct_count,
        }

        if concluded:
            update_data["status"] = "completed"
            update_data["completed_at"] = "now()"

        await update("case_study_sessions", f"id=eq.{req.session_id}", update_data)

        # 6. 返回
        response = {
            "narrative": narrative,
            "options": options,
            "evaluation": "correct" if is_correct else ("wrong" if is_correct is False else "neutral"),
            "step": step,
            "max_steps": max_steps,
            "concluded": concluded,
        }

        if concluded:
            total = len(decisions)
            response["result"] = {
                "total_correct": correct_count,
                "total_steps": total,
                "accuracy": round(correct_count / total, 2) if total > 0 else 0,
                "rating": "优秀" if correct_count / total >= 0.8 else ("良好" if correct_count / total >= 0.6 else "需加强"),
                "decisions": decisions,
            }

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
