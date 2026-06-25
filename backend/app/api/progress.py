"""课程进度 API（+ 缓存）"""
from fastapi import APIRouter, HTTPException
from app.database import select
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/api/progress", tags=["进度"])
CACHE_KEY = "progress_v2"


@router.get("")
async def get_progress(student_id: str = "00000000-0000-0000-0000-000000000005"):
    """获取学生学习进度汇总"""
    cached = cache_get(CACHE_KEY, ttl=30)
    if cached:
        return cached

    try:
        kps = await select("knowledge_points", "id,name,chapter,difficulty,sort_order", filters="order=chapter.asc,sort_order.asc")
        sessions = await select("learning_sessions", filters=f"student_id=eq.{student_id}&select=kp_id,final_decision,post_test_score,cycle_number")

        # Per-KP progress
        kp_progress = {}
        for s in sessions:
            kpid = s["kp_id"]
            if kpid not in kp_progress:
                kp_progress[kpid] = {"passed": False, "attempts": 0, "best": 0, "cycles": 0}
            kp_progress[kpid]["attempts"] += 1
            kp_progress[kpid]["cycles"] = max(kp_progress[kpid]["cycles"], s.get("cycle_number", 0))
            if s.get("final_decision") == "pass":
                kp_progress[kpid]["passed"] = True
            score = s.get("post_test_score") or 0
            if score > kp_progress[kpid]["best"]:
                kp_progress[kpid]["best"] = score

        total = len(kps)
        mastered = sum(1 for kp in kps if kp_progress.get(kp["id"], {}).get("passed"))
        attempted = sum(1 for kp in kps if kp_progress.get(kp["id"], {}).get("attempts", 0) > 0)

        # Average accuracy
        all_scores = [s.get("post_test_score") or 0 for s in sessions if s.get("post_test_score") is not None]
        avg_accuracy = round(sum(all_scores) / len(all_scores) * 100) if all_scores else 0

        # Recent activity (last 7 days)
        from datetime import datetime, timezone, timedelta
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_sessions = [s for s in sessions if s.get("started_at", "") > week_ago] if hasattr(sessions[0] if sessions else None, 'get') else []

        # Chapter progress
        chapters = {}
        for kp in kps:
            ch = kp.get("chapter") or "Other"
            if ch not in chapters:
                chapters[ch] = {"total": 0, "mastered": 0}
            chapters[ch]["total"] += 1
            if kp_progress.get(kp["id"], {}).get("passed"):
                chapters[ch]["mastered"] += 1

        result = {
            "total_kps": total,
            "mastered": mastered,
            "attempted": attempted,
            "avg_accuracy": avg_accuracy,
            "total_sessions": len(sessions),
            "chapters": sorted([{"name": k, **v} for k, v in chapters.items()], key=lambda x: x["name"]),
        }
        cache_set(CACHE_KEY, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
