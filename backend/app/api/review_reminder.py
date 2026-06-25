"""艾宾浩斯复习提醒 API — 纯逻辑，零 AI 成本"""
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.database import select, insert
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/api/review", tags=["复习提醒"])

INTERVALS = [1, 3, 7]           # 天
MAX_DISPLAY = 3                  # 每天最多展示 3 个
QUESTIONS_PER_REVIEW = 3         # 每次复习 3 道题


# ==================== 类型 ====================

class ReviewStartRequest(BaseModel):
    student_id: str = Field(default="00000000-0000-0000-0000-000000000005")
    kp_id: str
    interval_day: int

class AnswerItem(BaseModel):
    question_id: str
    answer: str

class ReviewSubmitRequest(BaseModel):
    student_id: str
    kp_id: str
    interval_day: int
    answers: list[AnswerItem]


# ==================== 辅助 ====================

async def _fetch_questions(kp_id: str, count: int = 3) -> list[dict]:
    """随机抽题"""
    rows = await select("questions", filters=f"kp_id=eq.{kp_id}&limit=30")
    if not rows:
        return []
    return random.sample(rows, min(count, len(rows)))


# ==================== 接口 ====================

@router.get("/due")
async def get_due_reviews(student_id: str = "00000000-0000-0000-0000-000000000005"):
    """计算今日待复习的知识点（最多 3 个）"""
    cache_key = f"review_due_{student_id}"
    cached = cache_get(cache_key, ttl=120)
    if cached:
        return cached

    try:
        # 1. 取所有 pass 的 learning_sessions
        sessions = await select(
            "learning_sessions",
            filters=f"student_id=eq.{student_id}&final_decision=eq.pass&order=started_at.desc&select=id,kp_id,started_at"
        )
        if not sessions:
            return {"total_due": 0, "items": []}

        # 2. 取所有已有的复习记录
        reviews = await select(
            "review_logs",
            filters=f"student_id=eq.{student_id}&select=kp_id,interval_day"
        )
        reviewed = set()
        for r in reviews:
            reviewed.add((r["kp_id"], r["interval_day"]))

        # 3. 对每个 kp（只取最近一次 pass），计算是否到间隔
        now = datetime.now(timezone.utc)
        seen_kps = set()
        due_items = []

        for s in sessions:
            kpid = s["kp_id"]
            if kpid in seen_kps:
                continue
            seen_kps.add(kpid)

            started_at = s.get("started_at")
            if not started_at:
                continue
            # 解析时间
            if isinstance(started_at, str):
                started_at = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
            days_since = (now - started_at).days

            for interval in INTERVALS:
                if days_since >= interval and (kpid, interval) not in reviewed:
                    due_items.append({
                        "kp_id": kpid,
                        "interval_day": interval,
                        "days_since_learned": days_since,
                        "learned_at": s["started_at"],
                        "source_session_id": s["id"],
                    })

        # 4. 填充 kp_name + chapter
        if due_items:
            kp_ids = list(set(d["kp_id"] for d in due_items))
            kp_rows = await select(
                "knowledge_points",
                filters=f"id=in.({','.join(kp_ids)})&select=id,name,chapter"
            )
            kp_map = {r["id"]: r for r in kp_rows}
            for item in due_items:
                kp = kp_map.get(item["kp_id"], {})
                item["kp_name"] = kp.get("name", "未知")
                item["chapter"] = kp.get("chapter", "")

        # 5. 按距上次学习最久排序，取前 MAX_DISPLAY
        due_items.sort(key=lambda x: x["days_since_learned"], reverse=True)
        due_items = due_items[:MAX_DISPLAY]

        result = {"total_due": len(due_items), "items": due_items}
        cache_set(cache_key, result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_review(req: ReviewStartRequest):
    """开始一次复习：抽 3 道题"""
    try:
        questions = await _fetch_questions(req.kp_id, QUESTIONS_PER_REVIEW)
        if not questions:
            raise HTTPException(status_code=404, detail="该知识点暂无题目")

        # 查 kp 名字
        kp_rows = await select("knowledge_points", filters=f"id=eq.{req.kp_id}&select=name")
        kp_name = kp_rows[0]["name"] if kp_rows else "未知"

        return {
            "kp_id": req.kp_id,
            "kp_name": kp_name,
            "interval_day": req.interval_day,
            "questions": [
                {
                    "id": q["id"],
                    "type": q.get("type", "choice"),
                    "question_text": q.get("question_text", ""),
                    "options": q.get("options"),
                }
                for q in questions
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_review(req: ReviewSubmitRequest):
    """提交复习答案 → 评分 → 写入 review_logs"""
    try:
        # 1. 拿正确答案
        q_ids = [a.question_id for a in req.answers]
        if not q_ids:
            raise HTTPException(status_code=400, detail="答案不能为空")

        q_rows = await select(
            "questions",
            filters=f"id=in.({','.join(q_ids)})&select=id,correct_answer,explanation"
        )
        q_map = {q["id"]: q for q in q_rows}

        # 2. 评分
        correct = 0
        results = []
        for a in req.answers:
            q = q_map.get(a.question_id)
            is_correct = q and a.answer.strip().lower() == q["correct_answer"].strip().lower()
            if is_correct:
                correct += 1
            results.append({
                "question_id": a.question_id,
                "correct": is_correct,
                "correct_answer": q["correct_answer"] if q else "",
                "explanation": q.get("explanation", "") if q else "",
            })

        score = correct / len(req.answers) if req.answers else 0

        # 3. 写入 review_logs
        await insert("review_logs", {
            "student_id": req.student_id,
            "kp_id": req.kp_id,
            "interval_day": req.interval_day,
            "score": score,
        })

        # 4. 反馈
        return {
            "score": round(score, 2),
            "correct": correct,
            "total": len(req.answers),
            "passed": score >= 0.6,
            "results": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
