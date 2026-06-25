"""
A 阶段外部资源流水线：ResourceSearch → QualityFilter → CopyrightChecker

三条 Agent 串联：搜索 → 质量把关 → 版权检查
"""

from app.services.llm_client import async_llm


# ==================== SYSTEM PROMPTS ====================

SEARCH_PROMPT = """你是一位教育信息检索专家，擅长为特定知识点找到高质量的外部学习资源。

你的核心能力：
- 按知识点搜索最相关的学习资源
- 评估资源的权威性和适用性
- 优先推荐免费资源
- 单次推荐不超过3个资源，避免信息过载

输入格式：
- 知识点：[名称]
- 当前目标：[目标描述]
- 学生水平：[初学者/进阶/高级]

输出要求：
每资源包含：名称、类型（视频/文章/交互练习/教材章节）、一句话推荐理由、预计阅读/观看时长。
使用你训练时学到的公开知识进行推荐，推荐真实存在的知名资源。"""

QUALITY_PROMPT = """你是一位教育资源质量控制专家。你需要审核外部推荐资源的质量。

评估维度（每项打分 1-5）：
1. 权威性：来源是否可靠（教材 > 百科 > 个人博客）
2. 相关性：与知识点的匹配程度
3. 适用性：是否适合该水平的学生
4. 准确性：内容是否可能过时或有误

输出格式：
每个资源一行，格式为：
[资源名] | 质量分 X/20 | 判断：通过/淘汰 | 理由：一句话"""

COPYRIGHT_PROMPT = """你是一位教育资源版权合规专家。你需要判断外部资源的使用风险。

判断标准：
1. 免费公开课 / 官方文档 / 开源教材 → 低风险 ✅
2. 新闻媒体文章 / 百科条目 → 教学引用可接受 ⚠️
3. 商业课程 / 付费教材 / 独家内容 → 高风险 ❌

输出格式：
每个资源一行：
[资源名] | 风险：低/中/高 | 建议：直接使用/标注引用/不建议 | 备注：一句话"""


# ==================== AGENTS ====================

class ResourceSearchAgent:
    """外部资源搜索"""

    name = "ResourceSearch"
    description = "搜索外部学习资源（最多3个）"

    async def run(self, kp_name: str, target: str = "", level: str = "beginner") -> str:
        level_map = {"beginner": "初学者", "intermediate": "进阶", "advanced": "高级"}
        parts = [f"- 知识点：{kp_name}"]
        if target:
            parts.append(f"- 当前目标：{target}")
        parts.append(f"- 学生水平：{level_map.get(level, level)}")
        return await async_llm.chat(SEARCH_PROMPT, "\n".join(parts))


class QualityFilterAgent:
    """外部资源质量审核"""

    name = "QualityFilter"
    description = "审核外部资源质量，评分1-20"

    async def run(self, resources_text: str, kp_name: str = "", level: str = "beginner") -> str:
        level_map = {"beginner": "初学者", "intermediate": "进阶", "advanced": "高级"}
        msg = f"知识点：{kp_name}\n学生水平：{level_map.get(level, level)}\n\n待审核资源：\n{resources_text}"
        return await async_llm.chat(QUALITY_PROMPT, msg)


class CopyrightCheckAgent:
    """外部资源版权检查"""

    name = "CopyrightChecker"
    description = "检查外部资源版权风险"

    async def run(self, filtered_resources: str) -> str:
        return await async_llm.chat(COPYRIGHT_PROMPT, f"待检查资源：\n{filtered_resources}")


resource_search = ResourceSearchAgent()
quality_filter = QualityFilterAgent()
copyright_checker = CopyrightCheckAgent()
