"""
ResourceGenerator — KSTAR A 阶段：学习资源生成智能体

根据目标 T + 学生画像，生成 5 种格式的学习材料
画像驱动选型：visual→mind_map, exam→exercise_bank
"""

from app.services.llm_client import async_llm

RESOURCE_TYPES = {
    "lecture_note": {
        "label": "课程讲解文档",
        "instruction": "生成课程讲解文档格式。包含核心概念、知识要点、易混淆辨析、典型例题。",
    },
    "mind_map": {
        "label": "知识点思维导图",
        "instruction": "生成 Markdown 层级大纲格式的思维导图。用缩进表示层级关系，简洁清晰。",
    },
    "exercise_bank": {
        "label": "智能练习题库",
        "instruction": "生成5道练习题(混合单选/多选/判断)，包含答案和详细解析。",
    },
    "extended_reading": {
        "label": "拓展阅读材料",
        "instruction": "生成拓展阅读材料。包含真实案例、行业实践、延伸思考、推荐阅读。",
    },
    "video_script": {
        "label": "视频讲解脚本",
        "instruction": "生成3-5分钟视频讲解脚本。包含开场白、核心讲解(3要点)、案例、总结。",
    },
}

SYSTEM_PROMPT = """你是一位高效的教学内容设计师，擅长根据资源类型要求生成不同格式的学习材料。

你能生成的 5 种资源类型：

【lecture_note - 课程讲解文档】
结构：
## 讲解文档：[知识点名称]
### 核心概念
[2-3句话精炼讲清是什么，为什么重要]
### 知识要点
- 要点1：[说明]
- 要点2：[说明]
### 易混淆点辨析
[如果存在容易混淆的概念，做对比说明]
### 典型例题
[题目]
[答案+解析]

【mind_map - 知识点思维导图】
输出 Markdown 层级大纲：
- 核心概念
  - 定义
  - 特征
  - 分类
  - 关键规则
  - 常见误区
  - 与相关概念的关系

【exercise_bank - 智能练习题库】
5道练习题（含答案和解析），混合单选、多选、判断。

【extended_reading - 拓展阅读材料】
真实案例 + 行业实践 + 延伸思考 + 推荐阅读。

【video_script - 视频讲解脚本】（3-5分钟）
开场白(30s) → 核心讲解3要点(2min) → 案例(1min) → 总结(30s)

核心原则：精准、实用、不废话。根据类型严格按对应格式输出。"""


# 画像 → 资源类型映射
IMAGE_TO_TYPE = {
    "visual": "mind_map",
    "auditory": "video_script",
    "reading": "lecture_note",
}

# 学习目标 → 内容侧重
GOAL_INSTRUCTION = {
    "exam": "侧重考题解析和易错点辨析，多出练习题",
    "practical": "侧重实际案例和行业应用场景",
    "basic": "用通俗语言解释，多举生活例子",
}

# 解释风格
STYLE_INSTRUCTION = {
    "concise": "言简意赅，只讲关键要点，不展开",
    "balanced": "详略得当，核心概念展开讲，其他点到为止",
    "detailed": "详细解释，多举例，多类比，确保理解透彻",
}

LEVEL_MAP = {"beginner": "初学者", "intermediate": "进阶", "advanced": "高级"}


class ResourceGenerator:
    """学习资源生成智能体"""

    name = "ResourceGenerator"
    description = "根据目标 T + 学生画像，生成 5 种格式的学习材料"

    async def run(
        self,
        kp_name: str,
        cognitive_style: str = "reading",
        learning_goal: str = "basic",
        explanation_style: str = "balanced",
        level: str = "beginner",
        common_errors: str = "",
        target_description: str = "",
    ) -> dict:
        """
        生成学习资源
        - cognitive_style: visual/auditory/reading → 选资源类型
        - learning_goal: exam/practical/basic → 侧重方向
        - explanation_style: concise/balanced/detailed → LLM 风格
        """
        # 画像选型
        resource_type = IMAGE_TO_TYPE.get(cognitive_style, "lecture_note")
        type_info = RESOURCE_TYPES.get(resource_type, RESOURCE_TYPES["lecture_note"])

        # 内容侧重
        goal_hint = GOAL_INSTRUCTION.get(learning_goal, "")
        style_text = STYLE_INSTRUCTION.get(explanation_style, "详略得当")
        level_cn = LEVEL_MAP.get(level, level)

        parts = [
            f"- 知识点名称：{kp_name}",
            f"- 资源类型：{type_info['label']}",
            f"- 输出格式要求：{type_info['instruction']}",
            f"- 学生水平：{level_cn}",
            f"- 讲解风格要求：{style_text}",
        ]
        if goal_hint:
            parts.append(f"- 内容侧重：{goal_hint}")
        if common_errors:
            parts.append(f"- 学生常见错误：{common_errors}")
        if target_description:
            parts.append(f"- 目标描述：{target_description}")

        user_message = "\n".join(parts)
        content = await async_llm.chat(SYSTEM_PROMPT, user_message)

        return {
            "type": resource_type,
            "label": type_info["label"],
            "content": content,
        }


resource_generator = ResourceGenerator()
