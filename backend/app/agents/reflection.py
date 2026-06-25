"""
ReflectionEvaluator — KSTAR R 阶段：反思评估智能体

后测 → 判断 pass/retry/fuse → 输出 K 状态更新
"""

from app.services.llm_client import async_llm

SYSTEM_PROMPT = """你是一位学习评估专家，负责判断学生是否达到学习目标，并决定下一步行动。

你的核心能力：
- 根据后测结果判断是否达标（正确率 ≥ 80% 视为通过）
- 分析未达标的根本原因
- 决定：继续当前知识点 / 进入下一个知识点 / 建议求助
- 输出简短的状态更新（一句话），用于更新K

输入格式：
- 知识点名称：[知识点]
- 后测正确率：[百分比]
- 后测答题记录：[{题号, 对/错}]
- 当前循环次数：[第1次/第2次]

输出要求：
你必须严格按以下规则判断：

1. 如果正确率 ≥ 80% → 输出：达标
2. 如果正确率 < 80% 且 循环次数 = 1 → 输出：不达标，建议再学一轮
3. 如果正确率 < 80% 且 循环次数 ≥ 2 → 输出：不达标，建议求助

无论哪种结果，你都必须输出一句简短的状态更新：
"学生[已掌握/未掌握][知识点名称]，当前正确率[百分比]。[建议]"
"""

PASS_THRESHOLD = 0.80
MAX_CYCLES = 2


class ReflectionEvaluator:
    """反思评估智能体"""

    name = "ReflectionEvaluator"
    description = "后测评估，判断 pass/retry/fuse"

    def _decide(self, accuracy: float, cycle_num: int) -> str:
        if accuracy >= PASS_THRESHOLD:
            return "pass"
        elif cycle_num < MAX_CYCLES:
            return "retry"
        else:
            return "fuse"

    async def run(
        self,
        kp_name: str,
        accuracy: float,
        test_records: list[dict],
        cycle_num: int,
    ) -> dict:
        """
        返回: {"decision": "pass"|"retry"|"fuse", "reflection": str}
        """
        decision = self._decide(accuracy, cycle_num)
        labels = {"pass": "达标", "retry": "不达标，建议再学一轮", "fuse": "不达标，建议求助（熔断）"}

        records_str = ""
        for r in test_records:
            mark = "✓" if r.get("correct") else "✗"
            records_str += f"  - 题{r.get('id', '?')}: {mark}\n"

        accuracy_pct = round(accuracy * 100, 1)

        user_message = f"""知识点名称：{kp_name}
后测正确率：{accuracy_pct}%
后测答题记录：
{records_str}
当前循环次数：第{cycle_num}次

（系统预判: {labels.get(decision, decision)}）
请输出评估结论，并包含一句简短的状态更新。"""

        reflection = await async_llm.chat(SYSTEM_PROMPT, user_message)

        return {"decision": decision, "reflection": reflection}


reflection_evaluator = ReflectionEvaluator()
