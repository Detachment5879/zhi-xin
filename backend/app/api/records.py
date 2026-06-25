"""学习记录 & 错题本 API（并行优化版）"""
import asyncio
from fastapi import APIRouter, HTTPException
from app.database import select, delete as db_delete
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/api/records", tags=["学习记录"])


@router.delete("/delete-session")
async def delete_session(id: str = ""):
    try:
        await db_delete("resource_generations", f"session_id=eq.{id}")
        await db_delete("learning_sessions", f"id=eq.{id}")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_sessions(student_id: str = "00000000-0000-0000-0000-000000000005", limit: int = 20):
    cache_key = f"records_sessions_{student_id}_{limit}"
    cached = cache_get(cache_key, ttl=60)
    if cached:
        return cached

    try:
        data = await select("learning_sessions", filters=f"student_id=eq.{student_id}&order=started_at.desc&limit={limit}&select=id,kp_id,cycle_number,pre_test_score,post_test_score,final_decision,target,started_at")
        if not data:
            return []

        kp_ids = list(set(s.get("kp_id", "") for s in data if s.get("kp_id")))
        kp_map = {}
        if kp_ids:
            kp_rows = await select("knowledge_points", filters=f"id=in.({','.join(kp_ids)})&select=id,name")
            kp_map = {r["id"]: r["name"] for r in kp_rows}

        result = [{
            "id": s["id"], "kp_name": kp_map.get(s.get("kp_id", ""), "未知"),
            "cycle_number": s.get("cycle_number"),
            "pre_test_score": s.get("pre_test_score"),
            "post_test_score": s.get("post_test_score"),
            "final_decision": s.get("final_decision"),
            "target": (s.get("target") or "")[:150],
            "started_at": s.get("started_at"),
        } for s in data]
        cache_set(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wrong-answers")
async def get_wrong_answers(student_id: str = "00000000-0000-0000-0000-000000000005", limit: int = 30):
    try:
        # Step 1: Fetch sessions
        sessions = await select("learning_sessions", filters=f"student_id=eq.{student_id}&order=started_at.desc&limit={limit}&select=id,kp_id,pre_test_detail,post_test_detail,started_at")
        if not sessions:
            return []

        # Collect wrong question IDs and KP IDs
        wrong_qids: list[str] = []
        kp_ids: list[str] = []
        seen_qids = set()
        seen_kpids = set()

        for s in sessions:
            kpid = s.get("kp_id", "")
            if kpid and kpid not in seen_kpids:
                kp_ids.append(kpid)
                seen_kpids.add(kpid)
            for key in ["pre_test_detail", "post_test_detail"]:
                detail = s.get(key) or []
                if isinstance(detail, list):
                    for r in detail:
                        if isinstance(r, dict) and not r.get("correct") and r.get("id"):
                            qid = r["id"]
                            if qid not in seen_qids:
                                wrong_qids.append(qid)
                                seen_qids.add(qid)

        # Step 2: Parallel fetch KP names + question details
        kp_future = select("knowledge_points", filters=f"id=in.({','.join(kp_ids[:10])})&select=id,name") if kp_ids else asyncio.sleep(0)
        q_future = select("questions", filters=f"id=in.({','.join(wrong_qids[:20])})&select=id,kp_id,question_text,type,options,correct_answer,explanation") if wrong_qids else asyncio.sleep(0)

        if kp_ids and wrong_qids:
            kp_rows, q_rows = await asyncio.gather(kp_future, q_future)
        elif kp_ids:
            kp_rows, q_rows = await kp_future, []
        else:
            kp_rows, q_rows = [], await q_future if isinstance(q_future, list) else []

        kp_map = {r["id"]: r["name"] for r in (kp_rows or [])}
        q_map = {r["id"]: r for r in (q_rows or [])}

        # Build result
        result = []
        for qid in wrong_qids[:20]:
            q = q_map.get(qid)
            if not q:
                continue
            # Find which session this question belongs to
            kp_name = kp_map.get(q.get("kp_id", ""), "")
            result.append({
                "question_id": qid, "kp_name": kp_name,
                "question_text": q.get("question_text"), "type": q.get("type"),
                "options": q.get("options"), "correct_answer": q.get("correct_answer"),
                "explanation": q.get("explanation"),
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
