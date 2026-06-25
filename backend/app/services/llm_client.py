"""
统一 LLM 客户端

支持: DeepSeek / OpenAI / 星火 / Groq
所有 provider 均使用 OpenAI 兼容接口
"""

import os
from dataclasses import dataclass
from openai import OpenAI, AsyncOpenAI
from app.config import settings


@dataclass
class LLMConfig:
    api_key: str
    base_url: str
    model: str

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and "your-" not in self.api_key)


def _get_llm_config() -> LLMConfig:
    """根据配置的 provider 返回对应的 LLM 配置"""
    provider = settings.llm_provider

    if provider == "deepseek":
        return LLMConfig(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url or "https://api.deepseek.com/v1",
            model=settings.llm_model or "deepseek-chat",
        )
    elif provider == "openai":
        return LLMConfig(
            api_key=os.getenv("OPENAI_API_KEY", ""),
            base_url="https://api.openai.com/v1",
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        )
    elif provider == "spark":
        return LLMConfig(
            api_key=os.getenv("SPARK_API_KEY", ""),
            base_url=os.getenv("SPARK_BASE_URL", "https://spark-api-open.xf-yun.com/v1"),
            model=os.getenv("SPARK_MODEL", "4.0Ultra"),
        )
    elif provider == "groq":
        return LLMConfig(
            api_key=os.getenv("GROQ_API_KEY", ""),
            base_url="https://api.groq.com/openai/v1",
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
    else:
        raise ValueError(f"不支持的 LLM provider: {provider}")


# ==================== LLM Client ====================

class LLMClient:
    """同步 LLM 调用"""

    def __init__(self):
        self._cfg = _get_llm_config()

    @property
    def is_available(self) -> bool:
        return self._cfg.is_configured

    @property
    def provider_name(self) -> str:
        return settings.llm_provider

    @property
    def model_name(self) -> str:
        return self._cfg.model

    def _get_client(self) -> OpenAI:
        return OpenAI(api_key=self._cfg.api_key, base_url=self._cfg.base_url)

    def chat(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        """同步调用 LLM，返回完整回复"""
        if not self.is_available:
            raise RuntimeError(f"LLM ({settings.llm_provider}) 未配置 API Key")

        client = self._get_client()
        is_reasoner = "reasoner" in self._cfg.model
        if is_reasoner:
            messages = [{"role": "user", "content": f"{system_prompt}\n\n---\n\n{user_message}"}]
            response = client.chat.completions.create(
                model=self._cfg.model, messages=messages, max_tokens=max_tokens,
            )
        else:
            response = client.chat.completions.create(
                model=self._cfg.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
        return response.choices[0].message.content or ""


class AsyncLLMClient:
    """异步 LLM 调用（FastAPI 用）"""

    def __init__(self):
        self._cfg = _get_llm_config()

    @property
    def is_available(self) -> bool:
        return self._cfg.is_configured

    def _get_client(self) -> AsyncOpenAI:
        return AsyncOpenAI(api_key=self._cfg.api_key, base_url=self._cfg.base_url)

    async def chat(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        """异步调用 LLM"""
        if not self.is_available:
            raise RuntimeError(f"LLM ({settings.llm_provider}) 未配置 API Key")

        client = self._get_client()
        
        # deepseek-reasoner 不支持 temperature 和 system 角色，system prompt 合并到 user message
        is_reasoner = "reasoner" in self._cfg.model
        if is_reasoner:
            messages = [{"role": "user", "content": f"{system_prompt}\n\n---\n\n{user_message}"}]
            response = await client.chat.completions.create(
                model=self._cfg.model, messages=messages, max_tokens=max_tokens,
            )
        else:
            response = await client.chat.completions.create(
                model=self._cfg.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
        return response.choices[0].message.content or ""

    async def chat_stream(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ):
        """异步流式调用 LLM，逐 token yield"""
        if not self.is_available:
            raise RuntimeError(f"LLM ({settings.llm_provider}) 未配置 API Key")

        client = self._get_client()
        is_reasoner = "reasoner" in self._cfg.model
        if is_reasoner:
            messages = [{"role": "user", "content": f"{system_prompt}\n\n---\n\n{user_message}"}]
            stream = await client.chat.completions.create(
                model=self._cfg.model, messages=messages, max_tokens=max_tokens, stream=True,
            )
        else:
            stream = await client.chat.completions.create(
                model=self._cfg.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


# 全局单例
llm = LLMClient()
async_llm = AsyncLLMClient()
