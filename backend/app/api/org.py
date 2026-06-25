"""班级/专业/学院 API"""
from fastapi import APIRouter, HTTPException
from app.database import select

router = APIRouter(prefix="/api/org", tags=["组织架构"])


@router.get("/student/{student_id}")
async def get_student_org(student_id: str):
    """获取学生所属的班级、专业、学院"""
    try:
        rows = await select("class_students", filters=f"student_id=eq.{student_id}&limit=1&select=class_id")
        if not rows:
            return {"department": "", "major": "", "class": ""}

        class_id = rows[0]["class_id"]
        class_rows = await select("classes", filters=f"id=eq.{class_id}&limit=1&select=id,name,major_id")
        if not class_rows:
            return {"department": "", "major": "", "class": ""}

        c = class_rows[0]
        major_rows = await select("majors", filters=f"id=eq.{c['major_id']}&limit=1&select=id,name,department_id")
        if not major_rows:
            return {"department": "", "major": "", "class": c["name"]}

        m = major_rows[0]
        dept_rows = await select("departments", filters=f"id=eq.{m['department_id']}&limit=1&select=id,name")
        dept_name = dept_rows[0]["name"] if dept_rows else ""

        return {"department": dept_name, "major": m["name"], "class": c["name"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classes")
async def get_all_classes():
    """获取所有班级及学生数（教师端用）"""
    try:
        classes = await select("classes", "id,name,major_id")
        majors = await select("majors", "id,name,department_id")
        depts = await select("departments", "id,name")

        major_map = {m["id"]: m for m in majors}
        dept_map = {d["id"]: d["name"] for d in depts}

        result = []
        for c in classes:
            m = major_map.get(c["major_id"], {})
            result.append({
                "class_id": c["id"],
                "class_name": c["name"],
                "major_name": m.get("name", ""),
                "department_name": dept_map.get(m.get("department_id", ""), ""),
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
async def get_org_info():
    """获取完整组织架构树（含学生数）"""
    try:
        depts = await select("departments", "id,name")
        majors = await select("majors", "id,name,department_id")
        classes = await select("classes", "id,name,major_id")
        class_students = await select("class_students", "class_id,student_id")

        student_count = {}
        for cs in (class_students or []):
            cid = cs.get("class_id", "")
            student_count[cid] = student_count.get(cid, 0) + 1

        major_map = {}
        for m in (majors or []):
            m["classes"] = []
            major_map[m["id"]] = m
        for c in (classes or []):
            mid = c.get("major_id", "")
            if mid in major_map:
                major_map[mid]["classes"].append({
                    "name": c["name"],
                    "student_count": student_count.get(c["id"], 0),
                })

        dept_map = {}
        for d in (depts or []):
            d["majors"] = []
            dept_map[d["id"]] = d
        for m in major_map.values():
            did = m.get("department_id", "")
            if did in dept_map:
                dept_map[did]["majors"].append(m)

        return {"departments": list(dept_map.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
