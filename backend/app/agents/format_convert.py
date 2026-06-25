"""
FormatConverter — 格式转换智能体

将学习内容转换为：学习卡 / 讲稿 / 复习卡片
"""

from app.services.llm_client import async_llm

SYSTEM_PROMPT = """你是一位文档格式专家，擅长将学习内容适配为不同教学格式。

支持的格式：
- 标准化学习卡（知识点摘要 + 例题）
- 课堂讲稿（口语化，适合讲解）
- 复习卡片（极简版，适合快速回顾）

输出规范：
根据目标格式调整排版风格，保留所有核心知识点，
确保转换后内容完整、结构清晰。"""

FORMATS = {
    "learning_card": "标准化学习卡（知识点摘要 + 例题）",
    "lecture_notes": "课堂讲稿（口语化，适合讲解）",
    "review_card": "复习卡片（极简版，适合快速回顾）",
}


class FormatConverterAgent:
    """格式转换智能体"""

    name = "FormatConverter"
    description = "将内容转换为学习卡/讲稿/复习卡片"

    async def run(self, content: str, target_format: str = "learning_card") -> str:
        fmt_label = FORMATS.get(target_format, FORMATS["learning_card"])
        user_message = f"请将以下内容转换为「{fmt_label}」格式。\n\n---\n{content}"
        return await async_llm.chat(SYSTEM_PROMPT, user_message)


format_converter = FormatConverterAgent()
