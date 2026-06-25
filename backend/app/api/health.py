import httpx
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api", tags=["系统"])

HEADERS = {
    "apikey": settings.supabase_service_key,
    "Authorization": f"Bearer {settings.supabase_service_key}",
    "Content-Type": "application/json",
}

@router.get("/health")
async def health_check():
    """健康检查 - 验证数据库连接"""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{settings.supabase_url}/rest/v1/courses?limit=1",
                headers=HEADERS,
            )
            if r.status_code == 200:
                return {
                    "status": "ok",
                    "database": "connected",
                    "tables_accessible": True,
                }
            else:
                return {
                    "status": "error",
                    "database": f"HTTP {r.status_code}: {r.text[:200]}",
                }
    except Exception as e:
        return {"status": "error", "database": str(e)}
