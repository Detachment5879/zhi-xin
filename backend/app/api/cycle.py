"""KSTAR 完整学习循环 API"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.orchestrator import orchestrator

router = APIRouter(prefix="/api/kstar/cycle", tags=["学习循环"])


# ==================== 通用类型 ====================

class AnswerItem(BaseModel):
    question_id: str
    answer: str


# ==================== 1. 开始学习 ====================

class StartCycleRequest(BaseModel):
    student_id: str = Field(default="demo-student-001", description="学生 ID")
    kp_id: str = Field(..., description="知识点 ID（从数据库获取）")


class StartCycleResponse(BaseModel):
    session_id: str
    kp_name: str
    cycle_num: int
    phase: str
    questions: list[dict]


@router.post("/start", summary="开始学习")
async def start_cycle(req: StartCycleRequest):
    """K 阶段：抽题，返回 5 道前测题"""
    try:
        result = await orchestrator.start_cycle(req.student_id, req.kp_id)
        if result.get("action") == "fuse":
            raise HTTPException(status_code=400, detail=result["message"])
        if result.get("action") == "redirect":
            return result  # 前置未通过，提示先学前置
        return StartCycleResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 2. 提交前测 ====================

class PreTestRequest(BaseModel):
    session_id: str = Field(..., description="学习会话 ID")
    answers: list[AnswerItem] = Field(..., description="答题记录")


class PreTestResponse(BaseModel):
    phase: str
    action: str
    accuracy: float
    diagnosis: str | None = None
    message: str | None = None


@router.post("/submit-pre-test", response_model=PreTestResponse, summary="提交前测")
async def submit_pre_test(req: PreTestRequest):
    """评分 + 诊断。正确率 ≥80% 直接跳过"""
    try:
        result = await orchestrator.submit_pre_test(
            req.session_id,
            [a.model_dump() for a in req.answers],
        )
        return PreTestResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 3. 锁定目标 ====================

class TargetRequest(BaseModel):
    session_id: str
    course_goal: str = Field(default="", description="课程整体目标")
    diagnosis: str = Field(default="", description="诊断报告文本")


class TargetResponse(BaseModel):
    phase: str
    kp_name: str
    target: str


@router.post("/generate-target", response_model=TargetResponse, summary="锁定学习目标")
async def generate_target(req: TargetRequest):
    """S+T 阶段：差距分析，锁定原子目标"""
    try:
        result = await orchestrator.generate_target(req.session_id, req.course_goal, req.diagnosis)
        return TargetResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 4. 生成资源 ====================

class ResourceRequest(BaseModel):
    session_id: str


class ResourceResponse(BaseModel):
    phase: str
    resource_type: str
    label: str
    content: str
    review: dict


@router.post("/generate-resource", response_model=ResourceResponse, summary="生成学习资源")
async def generate_resource(req: ResourceRequest):
    """A 阶段：AI 生成 + ReviewAgent 审核"""
    try:
        result = await orchestrator.generate_resource(req.session_id)
        return ResourceResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 5. 后测 ====================

class PostTestFetchRequest(BaseModel):
    session_id: str


class PostTestFetchResponse(BaseModel):
    questions: list[dict]


@router.post("/fetch-post-test", response_model=PostTestFetchResponse, summary="获取后测题目")
async def fetch_post_test(req: PostTestFetchRequest):
    """获取3道后测题（排除前测做过的）"""
    try:
        result = await orchestrator.fetch_post_test(req.session_id)
        return PostTestFetchResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PostTestRequest(BaseModel):
    session_id: str
    answers: list[AnswerItem]


class PostTestResponse(BaseModel):
    phase: str
    decision: str
    accuracy: float
    reflection: str
    cycle_num: int
    next_action: str


@router.post("/submit-post-test", response_model=PostTestResponse, summary="提交后测")
async def submit_post_test(req: PostTestRequest):
    """R 阶段：评分 + 反思 → pass/retry/fuse"""
    try:
        result = await orchestrator.submit_post_test(
            req.session_id,
            [a.model_dump() for a in req.answers],
        )
        return PostTestResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
