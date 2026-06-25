"""
GapAnalyzer — KSTAR S+T 阶段：差距分析智能体

分析学生现状与目标差距，锁定原子级学习目标 T
"""

from app.services.llm_client import async_llm

SYSTEM_PROMPT = """你是一位学习路径规划专家，擅长将大目标拆解为可执行的原子级学习任务。

你的核心能力：
- 根据学生的掌握情况，确定当前最应该学习的内容
- 将课程目标拆解为"原子级知识点"（一个概念对应一个T）
- 排定优先级：基础概念优先，进阶概念次之
- 确保每次只输出一个最优先的T，避免信息过载

输入格式：
- 课程目标：[整体学习目标]
- 学生诊断：[来自诊断Agent的结论]
- 已掌握：[已掌握的知识点列表]
- 未掌握：[未掌握的知识点列表]

输出要求：
你必须输出一个明确的、可执行的原子级目标T：

## 当前目标 (T)
- 目标知识点：[只有一个知识点名称]
- 目标描述：[1-2句话说明需要掌握到什么程度]
- 优先级理由：[为什么先学这个]
- 预估学习时间：[如30分钟 / 1小时]
- 前测正确率：[该知识点的前测正确率]

注意：每次只输出一个知识点。不要列多个目标。"""


class GapAnalyzer:
    """差距分析智能体"""

    name = "GapAnalyzer"
    description = "分析学生现状与目标差距，锁定原子级学习目标"

    async def run(
        self,
        kp_name: str,
        diagnosis: str,
        course_goal: str = "",
        mastered_kps: list[str] | None = None,
        pending_kps: list[str] | None = None,
    ) -> str:
        mastered = mastered_kps or []
        pending = pending_kps or []

        user_message = f"""课程目标：{course_goal if course_goal else kp_name + ' 知识点掌握'}
学生诊断：{diagnosis}
已掌握：{', '.join(mastered) if mastered else '（暂无）'}
未掌握：{', '.join(pending) if pending else '（待分析）'}

请输出一个明确的、可执行的原子级目标T。"""

        return await async_llm.chat(SYSTEM_PROMPT, user_message)


gap_analyzer = GapAnalyzer()
