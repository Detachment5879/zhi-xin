"""健康检查 — 验证数据库连接"""
from fastapi import APIRouter
from app.database import _get_conn

router = APIRouter(prefix="/api", tags=["系统"])


@router.get("/health")
async def health_check():
    """健康检查 - 验证本地 SQLite 数据库"""
    try:
        conn = _get_conn()
        row = conn.execute("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table'").fetchone()
        table_count = row["cnt"] if row else 0
        return {
            "status": "ok",
            "database": "sqlite",
            "tables": table_count,
        }
    except Exception as e:
        return {"status": "error", "database": str(e)}
