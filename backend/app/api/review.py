"""ReviewAgent API — 内容审核"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.agents.review_agent import review_agent, ReviewContext

router = APIRouter(prefix="/api/review", tags=["审核"])


class ReviewRequest(BaseModel):
    content: str
    student_level: str = "undergraduate"
    target_difficulty: int = Field(default=3, ge=1, le=5)
    course_name: str = ""
    ontology_nodes: list[str] = []


class RuleCheckResponse(BaseModel):
    rule: str
    passed: bool
    detail: str


class ReviewResponse(BaseModel):
    score: int
    passed: bool
    checks: list[RuleCheckResponse]
    suggestions: list[str]
    timestamp: str


@router.post("/review_content", response_model=ReviewResponse, summary="审核内容")
async def review_content(req: ReviewRequest):
    """手动触发 ReviewAgent 审核一段内容"""
    try:
        ctx = ReviewContext(
            target_difficulty=req.target_difficulty,
            student_level=req.student_level,
            course_name=req.course_name,
            ontology_nodes=req.ontology_nodes,
        )
        result = review_agent.review(req.content, ctx)
        return ReviewResponse(
            score=result.score,
            passed=result.passed,
            checks=[RuleCheckResponse(rule=c.rule, passed=c.passed, detail=c.detail) for c in result.checks],
            suggestions=result.suggestions,
            timestamp=result.timestamp,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
