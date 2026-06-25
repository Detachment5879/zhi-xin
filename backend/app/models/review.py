"""ReviewAgent API 模型"""

from pydantic import BaseModel, Field
from typing import Optional


class ReviewRequest(BaseModel):
    content: str = Field(..., min_length=1, description="待审核的学习内容")
    student_level: Optional[int] = Field(None, ge=1, le=5, description="学生水平 1-5")
    target_difficulty: Optional[int] = Field(None, ge=1, le=5, description="目标难度 1-5")
    course_name: Optional[str] = Field(None, description="课程名称")
    ontology_nodes: Optional[list[str]] = Field(None, description="引用的知识节点 ID 列表")


class RuleCheckResponse(BaseModel):
    rule: str
    passed: bool
    detail: str


class ReviewResponse(BaseModel):
    passed: bool
    score: int
    total_rules: int = 6
    checks: list[RuleCheckResponse]
    suggestions: list[str]
    timestamp: str
