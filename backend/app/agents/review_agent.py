"""
ReviewAgent — 内容审核智能体

纯规则检查（不依赖 LLM），审核生成的讲义质量。
6 条固定审核规则，客观、可复现、零额外成本。
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import re
from typing import Optional


@dataclass
class RuleCheck:
    rule: str
    passed: bool
    detail: str


@dataclass
class ReviewResult:
    passed: bool
    score: int              # 0-100
    checks: list[RuleCheck] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class ReviewContext:
    student_level: Optional[int] = None        # 1-5
    target_difficulty: Optional[int] = None
    course_name: Optional[str] = None
    ontology_nodes: Optional[list[str]] = None  # 引用的知识节点 ID


class ReviewAgent:
    """规则驱动的内容审核智能体"""

    name = "ReviewAgent"
    description = "规则驱动的内容审核智能体，6 条固定规则检查生成内容质量"
    PASS_THRESHOLD = 67  # 至少 4/6 通过

    # ---- 公有接口 ----

    def review(self, content: str, context: ReviewContext | None = None) -> ReviewResult:
        if context is None:
            context = ReviewContext()

        checks: list[RuleCheck] = []
        suggestions: list[str] = []

        # 规则 1: 知识点引用
        has_ref = self._check_knowledge_ref(content)
        checks.append(RuleCheck(
            rule="知识点引用",
            passed=has_ref,
            detail="讲义引用了具体知识点" if has_ref else "缺少知识点编号引用"
        ))
        if not has_ref:
            suggestions.append("建议在讲义中引用具体的知识点编号，便于学生对照知识图谱学习")

        # 规则 2: 例题数量
        example_count = self._count_examples(content)
        has_example = example_count >= 1
        checks.append(RuleCheck(
            rule="例题数量",
            passed=has_example,
            detail=f"包含 {example_count} 道例题" if has_example else "缺少例题（至少需要 1 道）"
        ))
        if not has_example:
            suggestions.append("建议至少添加 1 道例题，帮助学生理解概念的应用")

        # 规则 3: 难度匹配
        if context.student_level is not None and context.target_difficulty is not None:
            diff_ok = abs(context.target_difficulty - context.student_level) <= 2
            checks.append(RuleCheck(
                rule="难度匹配",
                passed=diff_ok,
                detail=(
                    f"难度 {context.target_difficulty} 与学生水平 {context.student_level} 匹配"
                    if diff_ok
                    else f"难度 {context.target_difficulty} 与学生水平 {context.student_level} 差距过大"
                )
            ))
            if not diff_ok:
                suggestions.append(
                    f"当前难度与学生水平不匹配，建议调整至 {context.student_level}±1 的范围"
                )
        else:
            checks.append(RuleCheck(
                rule="难度匹配",
                passed=True,
                detail="（未提供学生水平信息，跳过难度检查）"
            ))

        # 规则 4: 长度合理性
        char_count = len(content)
        length_ok = 200 <= char_count <= 8000
        if length_ok:
            detail = f"内容长度 {char_count} 字，合理"
        elif char_count < 200:
            detail = f"内容过短（{char_count} 字），建议 ≥ 200 字"
        else:
            detail = f"内容过长（{char_count} 字），建议 ≤ 8000 字"
        checks.append(RuleCheck(rule="长度合理性", passed=length_ok, detail=detail))
        if char_count < 200:
            suggestions.append("内容过于简短，建议展开论述，增加解释和推导过程")
        if char_count > 8000:
            suggestions.append("内容过长，建议拆分或精炼，一次聚焦 1-2 个核心概念")

        # 规则 5: 结构完整性
        structure = self._check_structure(content)
        checks.append(RuleCheck(
            rule="结构完整性",
            passed=structure["ok"],
            detail=structure["detail"]
        ))
        if not structure["ok"]:
            for s in structure["missing"]:
                suggestions.append(f"建议添加「{s}」部分")

        # 规则 6: 本体论一致性
        if context.ontology_nodes and len(context.ontology_nodes) >= 2:
            onto = self._check_ontology_consistency(content, context.ontology_nodes)
            checks.append(RuleCheck(
                rule="本体论一致性",
                passed=onto["ok"],
                detail=onto["detail"]
            ))
            if not onto["ok"] and onto.get("suggestion"):
                suggestions.append(onto["suggestion"])
        else:
            checks.append(RuleCheck(
                rule="本体论一致性",
                passed=True,
                detail="（未提供本体论节点信息，跳过一致性检查）"
            ))

        # 计算总分
        passed_count = sum(1 for c in checks if c.passed)
        score = round((passed_count / len(checks)) * 100)

        return ReviewResult(
            passed=score >= self.PASS_THRESHOLD,
            score=score,
            checks=checks,
            suggestions=suggestions,
        )

    # ---- 私有规则实现 ----

    def _check_knowledge_ref(self, content: str) -> bool:
        return bool(
            re.search(r'adv-math-[A-Z]+\d+-\d+', content, re.IGNORECASE)
            or re.search(r'ch\d{2}', content, re.IGNORECASE)
            or '知识点' in content
        )

    def _count_examples(self, content: str) -> int:
        patterns = [
            r'例\s*\d+',
            r'例题\s*\d*',
            r'【例',
            r'证明.*?：',
            r'计算.*?：',
            r'Example',
        ]
        count = 0
        for p in patterns:
            matches = re.findall(p, content)
            count += len(matches)
        return min(count, 10)

    def _check_structure(self, content: str) -> dict:
        required = [
            ("概念定义", [r'定义', r'概念', r'什么是']),
            ("核心公式/定理", [r'公式', r'定理', r'法则']),
            ("推导/解释", [r'推导', r'证明', r'因为', r'所以']),
        ]
        missing = []
        for name, patterns in required:
            if not any(re.search(p, content) for p in patterns):
                missing.append(name)

        if not missing:
            return {"ok": True, "detail": "结构完整（概念+公式+推导）", "missing": missing}
        elif len(missing) <= 1:
            return {"ok": True, "detail": f"基本完整（缺少：{'、'.join(missing)}）", "missing": missing}
        else:
            return {"ok": False, "detail": f"结构不完整（缺少：{'、'.join(missing)}）", "missing": missing}

    def _check_ontology_consistency(self, content: str, nodes: list[str]) -> dict:
        found_chs = []
        for node_id in nodes:
            m = re.search(r'CH(\d+)', node_id, re.IGNORECASE)
            if m:
                found_chs.append(f"ch{m.group(1)}")
        distinct = list(set(found_chs))

        if len(distinct) >= 2:
            has_cross = bool(re.search(r'关系|关联|推广|特例|类比|前置|依赖', content))
            if has_cross:
                return {"ok": True, "detail": f"涉及 {len(distinct)} 个章节，已体现跨章节关联"}
            else:
                return {
                    "ok": False,
                    "detail": f"涉及 {len(distinct)} 个章节但未体现关联",
                    "suggestion": "建议在讲义中说明这些知识点之间的关系（如：推广关系、前置依赖等）"
                }
        return {"ok": True, "detail": "本体论一致性检查通过"}


# 模块级单例
review_agent = ReviewAgent()
