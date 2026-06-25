"""教师端 API（+ 缓存）"""
from fastapi import APIRouter, HTTPException
from app.database import select
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/api/teacher", tags=["教师端"])


@router.get("/students")
async def get_students(class_id: str = ""):
    """获取所有学生及学习统计，可按班级筛选"""
    cache_key = f"teacher_students_{class_id}"
    cached = cache_get(cache_key, ttl=30)
    if cached:
        return cached

    try:
        # Get class-student mapping
        class_students = await select("class_students", "class_id,student_id")
        student_class_map = {cs["student_id"]: cs["class_id"] for cs in (class_students or [])}

        # Get classes
        classes = await select("classes", "id,name,major_id")
        class_map = {c["id"]: c["name"] for c in (classes or [])}
        majors = await select("majors", "id,name")
        major_map = {m["id"]: m["name"] for m in (majors or [])}

        # Filter students by class if specified
        if class_id:
            allowed_students = [cs["student_id"] for cs in (class_students or []) if cs["class_id"] == class_id]
        else:
            allowed_students = [cs["student_id"] for cs in (class_students or [])]

        # Get all sessions
        sessions = await select("learning_sessions", filters="order=started_at.desc&limit=200&select=*")
        kps = await select("knowledge_points", "id,name")
        kp_map = {k["id"]: k["name"] for k in kps}

        # Group by student_id
        students: dict[str, dict] = {}
        for s in sessions:
            sid = s.get("student_id", "unknown")
            if sid not in students:
                students[sid] = {
                    "student_id": sid,
                    "total_sessions": 0,
                    "passed": 0,
                    "retried": 0,
                    "fused": 0,
                    "kps_attempted": set(),
                    "kps_passed": set(),
                    "scores": [],
                    "last_active": s.get("started_at", ""),
                }
            st = students[sid]
            st["total_sessions"] += 1
            decision = s.get("final_decision", "")
            if decision == "pass":
                st["passed"] += 1
                st["kps_passed"].add(s.get("kp_id", ""))
            elif decision == "retry":
                st["retried"] += 1
            elif decision == "fuse":
                st["fused"] += 1
            st["kps_attempted"].add(s.get("kp_id", ""))
            if s.get("post_test_score") is not None:
                st["scores"].append(s["post_test_score"])

        # Get student names from profiles
        student_ids = list(students.keys())
        name_map = {}
        if student_ids:
            ids_filter = ",".join(student_ids[:50])
            profiles = await select("student_profiles", filters=f"user_id=in.({ids_filter})&select=user_id,display_name,student_number")
            name_map = {p["user_id"]: p for p in (profiles or [])}

        result = []
        for sid, st in students.items():
            avg = round(sum(st["scores"]) / len(st["scores"]) * 100) if st["scores"] else 0
            kp_names_passed = [kp_map.get(kpid, kpid[:8]) for kpid in st["kps_passed"]]
            kp_names_attempted = [kp_map.get(kpid, kpid[:8]) for kpid in st["kps_attempted"]]
            profile = name_map.get(sid, {})
            class_name = class_map.get(student_class_map.get(sid, ""), "")
            major_name = major_map.get(classes[0].get("major_id", ""), "") if student_class_map.get(sid) else ""
            result.append({
                "student_id": profile.get("display_name") or profile.get("student_number") or sid[:12],
                "class_name": class_name,
                "total_sessions": st["total_sessions"],
                "passed": st["passed"],
                "retried": st["retried"],
                "fused": st["fused"],
                "avg_accuracy": avg,
                "kps_mastered": len(st["kps_passed"]),
                "kps_attempted": len(st["kps_attempted"]),
                "mastered_names": kp_names_passed,
                "last_active": st["last_active"],
            })

        result = sorted(result, key=lambda x: x["last_active"], reverse=True)
        cache_set(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}")
async def get_student_detail(student_id: str):
    """获取单个学生的详细学习记录"""
    try:
        sessions = await select("learning_sessions", filters=f"student_id=eq.{student_id}&order=started_at.desc&limit=50&select=*")
        kp_ids = list(set(s.get("kp_id", "") for s in sessions if s.get("kp_id")))
        kp_map = {}
        if kp_ids:
            kp_rows = await select("knowledge_points", filters=f"id=in.({','.join(kp_ids)})&select=id,name,chapter")
            kp_map = {r["id"]: r for r in kp_rows}

        records = []
        for s in sessions:
            kp = kp_map.get(s.get("kp_id", ""), {})
            records.append({
                "kp_name": kp.get("name", "未知"),
                "chapter": kp.get("chapter", ""),
                "cycle": s.get("cycle_number"),
                "pre_test": s.get("pre_test_score"),
                "post_test": s.get("post_test_score"),
                "decision": s.get("final_decision"),
                "started_at": s.get("started_at"),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/review-stats")
async def get_review_stats():
    """获取 ReviewAgent 审核统计"""
    cached = cache_get("teacher_review_stats", ttl=30)
    if cached:
        return cached
    # 资源类型中文映射
    TYPE_LABELS = {
        "lecture_note": "讲义笔记",
        "mind_map": "思维导图",
        "quiz": "练习题",
        "summary": "章节总结",
        "case_study": "案例分析",
        "comparison": "对比表",
    }
    try:
        resources = await select("resource_generations", filters="order=created_at.desc&limit=100&select=review_score,review_passed,resource_type")
        total = len(resources)
        passed = sum(1 for r in resources if r.get("review_passed"))
        scores = [r.get("review_score", 0) for r in resources if r.get("review_score")]
        avg = round(sum(scores) / len(scores)) if scores else 0

        # By type
        type_stats = {}
        for r in resources:
            t = r.get("resource_type", "unknown")
            if t not in type_stats:
                type_stats[t] = {"total": 0, "passed": 0}
            type_stats[t]["total"] += 1
            if r.get("review_passed"):
                type_stats[t]["passed"] += 1

        result = {
            "total_generations": total,
            "passed": passed,
            "failed": total - passed,
            "avg_score": avg,
            "by_type": [{"type": k, "label": TYPE_LABELS.get(k, k), **v} for k, v in type_stats.items()],
        }
        cache_set("teacher_review_stats", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily-stats")
async def get_daily_stats():
    """获取每日学习趋势"""
    cached = cache_get("teacher_daily_stats", ttl=60)
    if cached:
        return cached
    try:
        from collections import defaultdict
        sessions = await select("learning_sessions", filters="order=started_at.asc&limit=500&select=started_at,post_test_score,final_decision")
        daily = defaultdict(lambda: {"count": 0, "passed": 0, "scores": []})
        for s in sessions:
            date = (s.get("started_at") or "")[:10]
            if not date: continue
            daily[date]["count"] += 1
            if s.get("final_decision") == "pass": daily[date]["passed"] += 1
            if s.get("post_test_score") is not None: daily[date]["scores"].append(s["post_test_score"])
        result = [{"date": d, "count": v["count"], "passed": v["passed"],
                 "avg_accuracy": round(sum(v["scores"])/len(v["scores"])*100) if v["scores"] else 0}
                for d, v in sorted(daily.items())][-30:]
        cache_set("teacher_daily_stats", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}/case-study")
async def get_student_case_studies(student_id: str):
    """获取学生的案例实战记录"""
    cache_key = f"teacher_case_study_{student_id}"
    cached = cache_get(cache_key, ttl=30)
    if cached:
        return cached

    try:
        sessions = await select(
            "case_study_sessions",
            filters=f"student_id=eq.{student_id}&order=started_at.desc&limit=10"
        )
        if not sessions:
            return []

        scenario_ids = list(set(s.get("scenario_id", "") for s in sessions if s.get("scenario_id")))
        scenario_map = {}
        if scenario_ids:
            sc_rows = await select(
                "case_study_scenarios",
                filters=f"id=in.({','.join(scenario_ids)})&select=id,title"
            )
            scenario_map = {r["id"]: r["title"] for r in sc_rows}

        result = [{
            "scenario": scenario_map.get(s.get("scenario_id", ""), "未知场景"),
            "status": s.get("status"),
            "correct_count": s.get("correct_count", 0),
            "current_step": s.get("current_step", 0),
            "started_at": s.get("started_at"),
            "completed_at": s.get("completed_at"),
        } for s in sessions]
        cache_set(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chapter-difficulty")
async def get_chapter_difficulty():
    """获取各章节的学生困难度分析"""
    cached = cache_get("teacher_chapter_difficulty", ttl=30)
    if cached:
        return cached

    try:
        sessions = await select("learning_sessions", filters="limit=300&select=kp_id,final_decision,post_test_score")
        kps = await select("knowledge_points", "id,name,chapter")

        kp_map = {k["id"]: k for k in kps}
        
        # Per chapter: {total_attempts, failures, low_scores}
        chapters = {}
        for s in sessions:
            kp = kp_map.get(s.get("kp_id", ""), {})
            ch = kp.get("chapter", "其他")
            if ch not in chapters:
                chapters[ch] = {"total": 0, "fail": 0, "low": 0, "scores": []}
            chapters[ch]["total"] += 1
            if s.get("final_decision") in ("retry", "fuse"):
                chapters[ch]["fail"] += 1
            score = s.get("post_test_score")
            if score is not None:
                chapters[ch]["scores"].append(score)
                if score < 0.5:
                    chapters[ch]["low"] += 1

        result = []
        for ch, v in chapters.items():
            avg = round(sum(v["scores"]) / len(v["scores"]) * 100) if v["scores"] else 0
            fail_rate = round(v["fail"] / v["total"] * 100) if v["total"] > 0 else 0
            result.append({
                "chapter": ch,
                "total_attempts": v["total"],
                "fail_rate": fail_rate,
                "avg_score": avg,
                "low_count": v["low"],
            })

        result = sorted(result, key=lambda x: x["fail_rate"], reverse=True)
        cache_set("teacher_chapter_difficulty", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor")
async def get_learning_monitor():
    """学习监控：综合学生互动投入度指标"""
    cache_key = "teacher_monitor"
    cached = cache_get(cache_key, ttl=120)
    if cached:
        return cached

    try:
        from datetime import datetime, timezone, timedelta
        import asyncio
        now = datetime.now(timezone.utc)
        week_ago = (now - timedelta(days=7)).isoformat()

        # 并行拉取所有数据（4 个查询并发，减少 3 次网络往返）
        learning, case_studies, reviews, kps = await asyncio.gather(
            select("learning_sessions", filters="limit=500&select=student_id,kp_id,cycle_number,final_decision,post_test_score,started_at"),
            select("case_study_sessions", filters="limit=200&select=student_id,status,correct_count,current_step,started_at"),
            select("review_logs", filters="limit=200&select=student_id,interval_day,score,reviewed_at"),
            select("knowledge_points", "id,name,chapter"),
        )
        kp_map = {k["id"]: k for k in kps}

        # 聚合到学生
        students = {}
        for s in learning:
            sid = s.get("student_id", "unknown")
            if sid not in students:
                students[sid] = {"id": sid, "cycles": 0, "passed": 0, "retried": 0, "fused": 0,
                                 "scores": [], "kps_touched": set(), "last_active": "", "active_week": False}
            st = students[sid]
            st["cycles"] += 1
            d = s.get("final_decision", "")
            if d == "pass": st["passed"] += 1
            elif d == "retry": st["retried"] += 1
            elif d == "fuse": st["fused"] += 1
            st["kps_touched"].add(s.get("kp_id", ""))
            if s.get("post_test_score") is not None: st["scores"].append(s["post_test_score"])
            at = s.get("started_at", "")
            if at > st["last_active"]: st["last_active"] = at
            if at >= week_ago: st["active_week"] = True

        for cs in (case_studies or []):
            sid = cs.get("student_id", "unknown")
            if sid not in students:
                students[sid] = {"id": sid, "cycles": 0, "passed": 0, "retried": 0, "fused": 0,
                                 "scores": [], "kps_touched": set(), "last_active": "", "active_week": False,
                                 "case_studies": 0, "case_completed": 0, "case_score": 0}
            st = students[sid]
            st["case_studies"] = st.get("case_studies", 0) + 1
            if cs.get("status") == "completed":
                st["case_completed"] = st.get("case_completed", 0) + 1
                step = cs.get("current_step", 1)
                correct = cs.get("correct_count", 0)
                if step > 0:
                    st["case_score"] = max(st.get("case_score", 0), round(correct / step * 100))
            at = cs.get("started_at", "")
            if at > st.get("last_active", ""): st["last_active"] = at
            if at >= week_ago: st["active_week"] = True

        for rv in (reviews or []):
            sid = rv.get("student_id", "unknown")
            if sid not in students:
                students[sid] = {"id": sid, "cycles": 0, "passed": 0, "retried": 0, "fused": 0,
                                 "scores": [], "kps_touched": set(), "last_active": "", "active_week": False}
            st = students[sid]
            st["reviews_done"] = st.get("reviews_done", 0) + 1
            sc = rv.get("score", 0) or 0
            st["review_avg"] = st.get("review_avg", 0)
            if st["reviews_done"] > 0:
                st["review_avg"] = round((st["review_avg"] * (st["reviews_done"] - 1) + sc) / st["reviews_done"], 1)
            at = rv.get("reviewed_at", "")
            if at > st.get("last_active", ""): st["last_active"] = at
            if at >= week_ago: st["active_week"] = True

        # 构建输出
        items = []

        # 解析学生姓名
        student_ids = list(students.keys())
        name_map = {}
        if student_ids:
            ids_filter = ",".join(student_ids[:50])
            profiles = await select("student_profiles", filters=f"user_id=in.({ids_filter})&select=user_id,display_name,student_number")
            name_map = {p["user_id"]: p for p in (profiles or [])}

        for sid, st in students.items():
            profile = name_map.get(sid, {})
            display_name = profile.get("display_name") or profile.get("student_number") or sid[:12]
            avg_score = round(sum(st["scores"]) / len(st["scores"]) * 100) if st["scores"] else 0
            
            # AI 交互估算：每轮 KSTAR ≈ 3 次 AI 交互（诊断+生成+反思），案例每步 1 次
            ai_touches = st["cycles"] * 3 + st.get("case_studies", 0) * 4

            # 投入度评分 0-100
            engagement = min(100,
                st["cycles"] * 5 +                    # 每轮 5 分
                st.get("case_studies", 0) * 10 +      # 每个案例 10 分
                st.get("reviews_done", 0) * 3 +       # 每次复习 3 分
                (10 if st["active_week"] else 0)      # 本周活跃 +10
            )

            risk_level = "normal"
            if st["fused"] > 0 or (st["retried"] >= 3): risk_level = "high"
            elif st["retried"] >= 1 and avg_score < 60: risk_level = "medium"

            items.append({
                "student_id": sid,
                "display_name": display_name,
                "cycles": st["cycles"],
                "passed": st["passed"],
                "retried": st["retried"],
                "fused": st["fused"],
                "avg_score": avg_score,
                "kps_touched": len(st["kps_touched"]),
                "case_studies": st.get("case_studies", 0),
                "case_completed": st.get("case_completed", 0),
                "case_score": st.get("case_score", 0),
                "reviews_done": st.get("reviews_done", 0),
                "review_avg": st.get("review_avg", 0),
                "ai_touches": ai_touches,
                "engagement": engagement,
                "risk_level": risk_level,
                "active_week": st["active_week"],
                "last_active": st["last_active"],
            })

        items.sort(key=lambda x: x["engagement"], reverse=True)

        # 总量统计
        total_cycles = sum(s["cycles"] for s in students.values())
        total_case = sum(s.get("case_studies", 0) for s in students.values())
        total_review = sum(s.get("reviews_done", 0) for s in students.values())
        active_week = sum(1 for s in students.values() if s["active_week"])

        result = {
            "summary": {
                "total_students": len(items),
                "active_week": active_week,
                "total_cycles": total_cycles,
                "total_case_studies": total_case,
                "total_reviews": total_review,
                "total_ai_touches": total_cycles * 3 + total_case * 4,
            },
            "students": items,
        }
        cache_set(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
