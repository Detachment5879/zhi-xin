"""知识库 API（并行优化版 + 缓存）"""
import asyncio
from fastapi import APIRouter, HTTPException
from app.database import select
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/api/knowledge", tags=["知识库"])

CACHE_KEY = "knowledge_tree_v2"


@router.get("/tree")
async def get_knowledge_tree(student_id: str = "00000000-0000-0000-0000-000000000005"):
    cached = cache_get(CACHE_KEY, ttl=60)
    if cached:
        return cached

    try:
        # 并行查询：知识点列表 + 学习进度
        kps_task = select("knowledge_points", filters="order=chapter.asc,sort_order.asc&select=*")
        sessions_task = select("learning_sessions", filters=f"student_id=eq.{student_id}&select=kp_id,final_decision,post_test_score")

        kps, sessions = await asyncio.gather(kps_task, sessions_task)

        # Build progress map
        progress_map = {}
        for s in sessions:
            kpid = s["kp_id"]
            if kpid not in progress_map:
                progress_map[kpid] = {"attempts": 0, "passed": False, "best_score": 0}
            progress_map[kpid]["attempts"] += 1
            if s.get("final_decision") == "pass":
                progress_map[kpid]["passed"] = True
            if s.get("post_test_score"):
                score = s["post_test_score"]
                if score > progress_map[kpid]["best_score"]:
                    progress_map[kpid]["best_score"] = score

        # Group by chapter
        kp_map = {}
        chapters: dict[str, list] = {}
        for kp in kps:
            kp_map[kp["id"]] = kp["name"]
            ch = kp.get("chapter") or "Other"
            if ch not in chapters:
                chapters[ch] = []
            prog = progress_map.get(kp["id"], {"attempts": 0, "passed": False, "best_score": 0})
            chapters[ch].append({
                "id": kp["id"], "name": kp["name"], "difficulty": kp.get("difficulty", 1),
                "prerequisites": kp.get("prerequisites") or [],
                "description": kp.get("description", ""),
                "progress": prog,
            })

        # Resolve prerequisite names (already have kp_map from iteration)
        tree = []
        for ch_name, items in chapters.items():
            ch_items = []
            for item in items:
                prereq_names = [kp_map.get(pid, pid[:8]) for pid in item["prerequisites"]]
                ch_items.append({**item, "prerequisite_names": prereq_names})
            tree.append({"chapter": ch_name, "points": ch_items})

        cache_set(CACHE_KEY, tree)
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
