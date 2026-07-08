from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, review, llm, diagnostic, cycle, profile, records, chat, knowledge, progress, teacher, org, feynman, case_study, review_reminder
from app.config import settings

app = FastAPI(
    title="知薪",
    description="基于多智能体与大模型的高校个性化学习资源生成智能体",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — 允许 Vercel 前端和本地开发访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 部署后可以限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, tags=["系统"])
app.include_router(review.router, tags=["审核"])
app.include_router(llm.router, tags=["大模型"])
app.include_router(diagnostic.router, tags=["知薪"])
app.include_router(cycle.router, tags=["学习循环"])
app.include_router(profile.router, tags=["画像"])
app.include_router(records.router, tags=["学习记录"])
app.include_router(chat.router, tags=["智能问答"])
app.include_router(knowledge.router, tags=["知识库"])
app.include_router(progress.router, tags=["进度"])
app.include_router(teacher.router, tags=["教师端"])
app.include_router(org.router, tags=["组织架构"])
app.include_router(feynman.router, tags=["费曼讲台"])
app.include_router(case_study.router, tags=["案例实战"])
app.include_router(review_reminder.router, tags=["复习提醒"])

@app.get("/")
async def root():
    return {
        "name": "知薪",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.on_event("startup")
async def warm_cache():
    """后台预热缓存，不阻塞启动"""
    import asyncio
    async def _warm():
        await asyncio.sleep(5)
        import httpx
        base = f"http://127.0.0.1:{settings.port}"
        # 只预热最关键的 4 个，分两批
        batches = [
            ["/api/progress", "/api/knowledge/tree"],
            ["/api/teacher/students", "/api/teacher/review-stats"],
        ]
        async with httpx.AsyncClient(timeout=30) as c:
            for batch in batches:
                tasks = [c.get(f"{base}{u}") for u in batch]
                await asyncio.gather(*tasks, return_exceptions=True)
                await asyncio.sleep(1)
    asyncio.create_task(_warm())
