"""费曼讲台 API — 你给 AI 讲课，AI 追问检验理解"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.llm_client import async_llm
from app.database import select

router = APIRouter(prefix="/api/feynman", tags=["费曼讲台"])

FEYNMAN_SYSTEM = """你是一个"费曼讲台"中的AI学生。你的"老师"是一位正在学习《国际贸易实务》的大学生。
你的任务是用苏格拉底式追问检验老师是否真正理解了这个概念。

## 核心规则（必须遵守）
1. 假装你是一个刚入学的学弟/学妹，对这个知识点完全不懂
2. 先从简单问题开始："这个概念是干什么用的？"
3. 老师讲得含糊时追问细节："你说风险转移，那具体在哪个时间点转移？"
4. 老师讲得清楚时，换个角度刁难："那如果XXX情况发生了，怎么处理？"
5. 用生活化的比喻来测试理解："是不是就像淘宝买东西..."
6. 老师犯概念错误时，温和指出并给机会纠正："你确定吗？我记得书上说..."
7. 始终用口语化的中文，每次回复不超过3句话

## 评分规则（极其重要）
- **至少追问3轮以上才能开始考虑打分**，绝不能在第1-2轮就放弃追问
- 即使老师第一轮回答得很好，也必须继续从不同角度追问
- 只有当你从3个以上不同角度追问过、老师都答对了，才能在回复末尾加上 [SCORE:8-10分]
- 如果老师某些轮答得含糊或出错，继续追问，不要让分数低于 [SCORE:4分]
- 分数格式必须严格是 [SCORE:X分] 在回复最后一行，前面不能有任何其他内容

## 禁止行为
- 禁止在对话开始时就透露知识点的标准答案
- 禁止只说"很好"不追问，每一轮都必须提出新的具体问题
- 禁止在少于3轮交互时就给出评分

回复格式：先说你的追问，如果满足评分条件则在最后一行加 [SCORE:X分]"""


class FeynmanMessage(BaseModel):
    kp_name: str = Field(..., description="知识点名称")
    kp_id: str = Field(..., description="知识点ID")
    student_message: str = Field(..., description="学生的讲解内容")
    conversation_history: list[dict] = Field(default=[], description="之前的对话历史")


class FeynmanReply(BaseModel):
    reply: str = Field(..., description="AI学生的回复")
    score: int | None = Field(None, description="本轮评分（1-10），null表示还在对话中")


@router.post("/teach", response_model=FeynmanReply)
async def feynman_teach(req: FeynmanMessage):
    """学生给AI讲课，AI追问检验"""
    try:
        # 获取知识点详情作为参考
        kps = await select("knowledge_points", filters=f"id=eq.{req.kp_id}&select=name,description")
        kp_info = kps[0] if kps else {"name": req.kp_name, "description": ""}

        # 构建 user message（R1 不支持 system 角色，全部放 user_message 里）
        if len(req.conversation_history) == 0:
            # 第一轮：开场
            context = f"老师要给我讲的知识点是：{kp_info['name']}\n"
            if kp_info.get("description"):
                context += f"知识点简介（仅作参考，不要直接透露）：{kp_info['description']}\n"
            user_msg = context + "现在请先做个自我介绍，然后请老师开始讲课。"
        else:
            # 继续对话：把历史拼进去
            history_text = "## 之前的对话\n"
            for i, msg in enumerate(req.conversation_history[-8:]):
                role_label = "学弟(你)" if msg["role"] == "assistant" else "老师"
                history_text += f"{role_label}: {msg['content']}\n"
            history_text += f"\n老师刚说：{req.student_message}\n\n（当前已进行 {len(req.conversation_history)//2} 轮对话。如果已满3轮且老师答得好，请在回复末尾打出 [SCORE:X分]；如果还不满3轮，继续追问不要打分。）"
            user_msg = history_text

        reply = await async_llm.chat(
            system_prompt=FEYNMAN_SYSTEM,
            user_message=user_msg,
            max_tokens=512,
        )

        # 解析评分（支持多种格式）
        import re
        score = None
        match = re.search(r'\[SCORE:\s*(\d+)\s*分?\s*\]', reply)
        if not match:
            match = re.search(r'\[(\d+)/10\]', reply)
        if not match:
            match = re.search(r'评分[：:]\s*(\d+)', reply)
        if match:
            score = int(match.group(1))

        return FeynmanReply(reply=reply, score=score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
