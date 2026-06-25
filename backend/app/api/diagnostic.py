"""DiagnosticAgent + GapAnalyzer + ResourceGenerator + ExternalSearch API"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.agents.diagnostic import diagnostic_agent
from app.agents.gap_analyzer import gap_analyzer
from app.agents.resource_gen import resource_generator
from app.agents.resource_external import resource_search, quality_filter, copyright_checker
from app.agents.reflection import reflection_evaluator
from app.agents.format_convert import format_converter

router = APIRouter(prefix="/api/kstar", tags=["KSTAR"])


class TestRecord(BaseModel):
    id: int
    correct: bool


class DiagnosisRequest(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    records: list[TestRecord] = Field(..., description="答题记录")
    accuracy: float = Field(..., ge=0, le=1, description="正确率 0-1")


class DiagnosisResponse(BaseModel):
    kp_name: str
    accuracy: float
    diagnosis: str
    model: str
    provider: str


@router.post("/diagnose", response_model=DiagnosisResponse, summary="诊断评估")
async def diagnose(req: DiagnosisRequest):
    """分析学生前测答案，生成诊断报告"""
    try:
        from app.services.llm_client import llm
        result = await diagnostic_agent.run(
            kp_name=req.kp_name,
            test_records=[r.model_dump() for r in req.records],
            accuracy=req.accuracy,
            mode="full",
        )
        return DiagnosisResponse(
            kp_name=req.kp_name, accuracy=req.accuracy,
            diagnosis=result, model=llm.model_name, provider=llm.provider_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GapAnalyzer ====================

class GapAnalysisRequest(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    diagnosis: str = Field(..., description="诊断报告文本")
    course_goal: str = Field(default="", description="课程目标")
    mastered_kps: list[str] = Field(default_factory=list, description="已掌握知识点")
    pending_kps: list[str] = Field(default_factory=list, description="未掌握知识点")


class GapAnalysisResponse(BaseModel):
    kp_name: str
    target: str
    model: str
    provider: str


@router.post("/analyze-gap", response_model=GapAnalysisResponse, summary="差距分析")
async def analyze_gap(req: GapAnalysisRequest):
    """根据诊断结果，锁定当前学习目标 T"""
    try:
        from app.services.llm_client import llm
        result = await gap_analyzer.run(
            kp_name=req.kp_name,
            diagnosis=req.diagnosis,
            course_goal=req.course_goal,
            mastered_kps=req.mastered_kps,
            pending_kps=req.pending_kps,
        )
        return GapAnalysisResponse(
            kp_name=req.kp_name,
            target=result,
            model=llm.model_name,
            provider=llm.provider_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ResourceGenerator ====================

class ResourceGenRequest(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    cognitive_style: str = Field(default="reading", description="visual/auditory/reading")
    learning_goal: str = Field(default="basic", description="exam/practical/basic")
    explanation_style: str = Field(default="balanced", description="concise/balanced/detailed")
    level: str = Field(default="beginner", description="beginner/intermediate/advanced")
    common_errors: str = Field(default="", description="诊断到的常见错误")
    target_description: str = Field(default="", description="目标描述（从GapAnalyzer）")


class ResourceGenResponse(BaseModel):
    kp_name: str
    resource_type: str
    label: str
    content: str
    model: str
    provider: str


@router.post("/generate-resource", response_model=ResourceGenResponse, summary="生成学习资源")
async def generate_resource(req: ResourceGenRequest):
    """根据学生画像和目标生成个性化学习材料"""
    try:
        from app.services.llm_client import llm
        result = await resource_generator.run(
            kp_name=req.kp_name,
            cognitive_style=req.cognitive_style,
            learning_goal=req.learning_goal,
            explanation_style=req.explanation_style,
            level=req.level,
            common_errors=req.common_errors,
            target_description=req.target_description,
        )
        return ResourceGenResponse(
            kp_name=req.kp_name,
            resource_type=result["type"],
            label=result["label"],
            content=result["content"],
            model=llm.model_name,
            provider=llm.provider_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== External Resource Search ====================

class ExternalSearchRequest(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    target: str = Field(default="", description="当前学习目标")
    level: str = Field(default="beginner", description="学生水平")


class ExternalSearchResponse(BaseModel):
    raw_resources: str
    quality_check: str
    copyright_check: str


@router.post("/search-external", response_model=ExternalSearchResponse, summary="外部资源搜索+审核")
async def search_external(req: ExternalSearchRequest):
    """搜索外部资源 → 质量审核 → 版权检查，三步流水线"""
    try:
        raw = await resource_search.run(req.kp_name, req.target, req.level)
        quality = await quality_filter.run(raw, req.kp_name, req.level)
        copyright_ = await copyright_checker.run(quality)
        return ExternalSearchResponse(
            raw_resources=raw,
            quality_check=quality,
            copyright_check=copyright_,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ReflectionEvaluator ====================

class ReflectionRequest(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    accuracy: float = Field(..., ge=0, le=1, description="后测正确率")
    records: list[TestRecord] = Field(..., description="后测答题记录")
    cycle_num: int = Field(..., ge=1, description="当前循环次数")


class ReflectionResponse(BaseModel):
    kp_name: str
    accuracy: float
    cycle_num: int
    decision: str
    reflection: str


@router.post("/reflect", response_model=ReflectionResponse, summary="反思评估")
async def reflect(req: ReflectionRequest):
    """评估后测结果，决定 pass/retry/fuse"""
    try:
        result = await reflection_evaluator.run(
            kp_name=req.kp_name,
            accuracy=req.accuracy,
            test_records=[r.model_dump() for r in req.records],
            cycle_num=req.cycle_num,
        )
        return ReflectionResponse(
            kp_name=req.kp_name,
            accuracy=req.accuracy,
            cycle_num=req.cycle_num,
            decision=result["decision"],
            reflection=result["reflection"],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FormatConverter ====================

class FormatConvertRequest(BaseModel):
    content: str = Field(..., description="原始学习内容")
    target_format: str = Field(default="learning_card", description="learning_card/lecture_notes/review_card")


class FormatConvertResponse(BaseModel):
    target_format: str
    result: str


@router.post("/convert-format", response_model=FormatConvertResponse, summary="格式转换")
async def convert_format(req: FormatConvertRequest):
    """将学习内容转换为指定教学格式"""
    try:
        result = await format_converter.run(req.content, req.target_format)
        return FormatConvertResponse(target_format=req.target_format, result=result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
