"""LLM 相关 API"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.llm_client import async_llm, llm

router = APIRouter(prefix="/api/llm", tags=["大模型"])


class ChatRequest(BaseModel):
    system_prompt: str = Field(default="你是一个有帮助的助手。", description="系统提示")
    user_message: str = Field(..., description="用户消息")
    temperature: float = Field(default=0.3, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=8192)


class ChatResponse(BaseModel):
    reply: str
    model: str
    provider: str


@router.post("/chat", response_model=ChatResponse, summary="调用大模型")
async def chat(req: ChatRequest):
    """测试 LLM 连接"""
    try:
        reply = await async_llm.chat(
            system_prompt=req.system_prompt,
            user_message=req.user_message,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
        return ChatResponse(
            reply=reply,
            model=llm.model_name,
            provider=llm.provider_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", summary="LLM 状态")
async def llm_status():
    """查看当前 LLM 配置状态"""
    return {
        "provider": llm.provider_name,
        "model": llm.model_name,
        "configured": llm.is_available,
    }
