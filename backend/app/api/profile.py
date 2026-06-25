"""学生画像 API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import select, insert, update, delete as db_delete

router = APIRouter(prefix="/api/profile", tags=["画像"])


class ProfileSave(BaseModel):
    user_id: str
    cognitive_style: str = "reading"
    learning_goal: str = "basic"
    explanation_style: str = "balanced"


@router.get("")
async def get_profile(user_id: str = ""):
    """获取学生画像"""
    if not user_id:
        return {}
    try:
        rows = await select("student_profiles", filters=f"user_id=eq.{user_id}&limit=1")
        return rows[0] if rows else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def save_profile(profile: ProfileSave):
    """保存/更新学生画像"""
    try:
        existing = await select("student_profiles", filters=f"user_id=eq.{profile.user_id}&limit=1&select=id")
        data = {
            "cognitive_style": profile.cognitive_style,
            "learning_goal": profile.learning_goal,
            "explanation_style": profile.explanation_style,
        }
        if existing:
            await update("student_profiles", f"user_id=eq.{profile.user_id}", data)
        else:
            await insert("student_profiles", {**data, "user_id": profile.user_id, "survey_completed": True})
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_profile(user_id: str = ""):
    """重置学生画像为默认值"""
    try:
        await db_delete("student_profiles", f"user_id=eq.{user_id}")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
