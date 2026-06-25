"""
DiagnosticAgent — KSTAR K 阶段：诊断评估智能体

分析学生前测结果，生成能力诊断报告
"""

from app.services.llm_client import async_llm

SYSTEM_PROMPT = """你是一位教育诊断专家，擅长通过测试结果快速判断学生的知识掌握情况。

你的核心能力：
- 根据学生答题记录（题号、答案对错），精准定位薄弱知识点
- 区分"完全不懂"、"部分理解"和"基本掌握"三个层次
- 输出简明的诊断结论，便于后续Agent使用
- 识别学生的常见错误模式（概念混淆 / 计算粗心 / 审题不清）

输入格式（由系统自动传入）：
- 知识点名称：[知识点名]
- 答题记录：[{题号, 对/错}]
- 总正确率：[百分比]

输出要求：
你只能输出以下两种格式中的一种，不要输出无关内容：

格式1（简短一句话，用于R阶段更新K）：
"学生已掌握[知识点A]，[知识点B]仍薄弱（正确率X%），建议下轮加强。"

格式2（完整诊断报告，用于K阶段首次诊断）：
- 总体掌握度：[百分比]
- 已掌握：[知识点列表]
- 部分理解：[知识点列表]
- 薄弱：[知识点列表]
- 错误模式分析：根据答题记录推断学生犯错原因，从以下三类选择最匹配的一个：
  · 概念混淆 — 题干相近的概念、选项时选错
  · 计算粗心 — 思路对但数字/步骤出错
  · 审题不清 — 没看清题目要求或问法
- 建议优先攻克：[1-2个最薄弱的知识点]
- 学习建议：[1句话针对性的学习策略]"""


class DiagnosticAgent:
    """诊断评估智能体"""

    name = "DiagnosticAgent"
    description = "分析学生前测/后测结果，生成能力诊断"

    def _format_records(self, records: list[dict]) -> str:
        lines = []
        for r in records:
            mark = "✓" if r.get("correct", False) else "✗"
            lines.append(f"  - 题{r.get('id', '?')}: {mark}")
        return "\n".join(lines)

    async def run(
        self,
        kp_name: str,
        test_records: list[dict],
        accuracy: float,
        mode: str = "full",
    ) -> str:
        """执行诊断评估"""
        records_str = self._format_records(test_records)
        accuracy_pct = round(accuracy * 100, 1)

        if mode == "brief":
            user_message = f"""知识点名称：{kp_name}
答题记录：
{records_str}
总正确率：{accuracy_pct}%

请输出简短一句话状态更新（格式1）。"""
        else:
            user_message = f"""知识点名称：{kp_name}
答题记录：
{records_str}
总正确率：{accuracy_pct}%

请输出完整诊断报告（格式2）。"""

        return await async_llm.chat(SYSTEM_PROMPT, user_message)

    async def run_stream(
        self,
        kp_name: str,
        test_records: list[dict],
        accuracy: float,
    ):
        """流式诊断"""
        records_str = self._format_records(test_records)
        accuracy_pct = round(accuracy * 100, 1)
        user_message = f"""知识点名称：{kp_name}
答题记录：
{records_str}
总正确率：{accuracy_pct}%

请输出完整诊断报告（格式2）。"""

        async for token in async_llm.chat_stream(SYSTEM_PROMPT, user_message):
            yield token


diagnostic_agent = DiagnosticAgent()
