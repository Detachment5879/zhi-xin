"""
审计日志 — 全链路留痕

记录每次 Agent 调用的输入/输出/耗时，
用于答辩数据展示和后期分析
"""

import time
from app.database import insert

TABLE = "audit_logs"


async def log_agent_call(
    agent_name: str,
    phase: str,
    input_data: str,
    output_data: str,
    llm_model: str = "",
    duration_ms: float = 0,
    error: str = "",
    session_id: str = "",
    student_id: str = "",
):
    """记录一次 Agent 调用"""
    try:
        await insert(TABLE, {
            "agent_name": agent_name,
            "phase": phase,
            "input_summary": input_data[:500],
            "output_summary": output_data[:500],
            "llm_model": llm_model,
            "duration_ms": round(duration_ms),
            "error": error,
            "session_id": session_id,
            "student_id": student_id,
        })
    except Exception:
        pass  # 审计日志失败不影响主流程


class AuditContext:
    """上下文管理器，自动记录耗时"""
    def __init__(self, agent_name: str, phase: str, session_id: str = "", student_id: str = ""):
        self.agent_name = agent_name
        self.phase = phase
        self.session_id = session_id
        self.student_id = student_id
        self.start = 0

    def __enter__(self):
        self.start = time.time()
        return self

    def __exit__(self, *_):
        pass

    async def done(self, input_data: str, output_data: str, model: str = "", error: str = ""):
        duration = (time.time() - self.start) * 1000
        await log_agent_call(
            agent_name=self.agent_name,
            phase=self.phase,
            input_data=input_data,
            output_data=output_data,
            llm_model=model,
            duration_ms=duration,
            error=error,
            session_id=self.session_id,
            student_id=self.student_id,
        )


async def ensure_audit_table():
    """创建审计日志表（如果不存在）"""
    from app.config import settings
    import httpx
    h = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
    }
    # 注意：DDL 不能通过 REST API 执行，需要在 SQL Editor 手动创建
    # CREATE TABLE IF NOT EXISTS audit_logs (
    #     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    #     agent_name TEXT, phase TEXT,
    #     input_summary TEXT, output_summary TEXT,
    #     llm_model TEXT, duration_ms FLOAT,
    #     error TEXT, session_id UUID, student_id UUID,
    #     created_at TIMESTAMPTZ DEFAULT now()
    # );
    pass
