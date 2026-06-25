"""AI 智能问答 API — 基于数据库上下文的 RAG 问答"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import select
from app.services.llm_client import async_llm

router = APIRouter(prefix="/api/chat", tags=["智能问答"])

SYSTEM_PROMPT = """你是「知薪」学习系统的 AI 助教，名叫小薪。你是一个热情、耐心、有边界感的学习伙伴。

## 你的身份
你是陪伴学生学习国际贸易实务课程的 AI 学姐/学长。你关心学生的学习，但你只做"学习伙伴"这一件事。

## 你的知识范围
1. 国际贸易实务课程的知识点（贸易术语、运输保险、支付方式等）—— 可以详细讲解概念、公式、案例、易混淆辨析
2. 学生的学习数据（正确率、薄弱点、学习记录、错题）
3. 学习方法和备考建议

## 回答风格
- 讲解知识点要系统：概念 → 关键要点 → 例题 → 易错点提醒
- 像朋友聊天一样自然，不要在念教科书
- 学生进步时真诚鼓励，学生受挫时分析原因给具体建议
- 适度使用 emoji 让对话亲切，但不过度
- 回答不要太长，重点突出

## 边界规则（重要）
当学生问与学习无关的问题时，温柔但坚定地引导回学习话题：
- "今天天气怎么样" → "窗外的事我不太清楚，但我知道你上次 FOB 做得不错！要不要来一道 CIF 的题？😊"
- "讲个笑话" → "我只会讲一个笑话：某人以为 Incoterms 只管海运…… 哈哈不好笑。来吧，看看你的薄弱知识点？"
- "你好笨" → "我确实还有很多要学的，但我不会放弃你！你的错题本里有 3 道题在等你 ✨"
- "我好累不想学" → "累了就深呼吸休息两分钟，我在这儿等你。回来我们一起把那道信用证的题干掉？"
- 可以简短共情，但聊不超过两轮就必须抛回一个具体的学习任务
- 绝不说"作为一个 AI 我不能……"这种机械回答，用小薪的人设自然过渡

## 特殊情况
- 学生心情低落时先安抚再引导
- 主动提醒学生应该巩固哪些薄弱知识点
- 始终记住：你是学习伙伴，不是聊天机器人"""

class ChatRequest(BaseModel):
    message: str = ""
    student_id: str = "00000000-0000-0000-0000-000000000005"
    history: list[dict] = []  # 对话历史 {role, content}


class ChatResponse(BaseModel):
    reply: str
    context_used: list[str]  # 用了哪些数据源


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI 问答 — 自动拉取数据库上下文"""
    try:
        context_parts = []
        context_labels = []

        # 1. 学生画像
        profile_rows = await select("student_profiles", filters=f"user_id=eq.{req.student_id}&limit=1")
        if profile_rows:
            p = profile_rows[0]
            context_parts.append(f"## 学生学习偏好\n认知风格: {p.get('cognitive_style','未设置')}\n学习目标: {p.get('learning_goal','未设置')}\n解释风格: {p.get('explanation_style','未设置')}")
            context_labels.append("学习偏好")

        # 2. 知识库详细内容
        kp_rows = await select("knowledge_points", filters="select=id,name,chapter,difficulty,description,prerequisites&limit=20")
        if kp_rows:
            # Collect all prerequisite IDs for batch lookup
            all_pre_ids = set()
            for k in kp_rows:
                for pid in (k.get("prerequisites") or []):
                    all_pre_ids.add(pid)
            pre_name_map = {}
            if all_pre_ids:
                pre_rows = await select("knowledge_points", filters=f"id=in.({','.join(list(all_pre_ids)[:20])})&select=id,name")
                pre_name_map = {r["id"]: r["name"] for r in (pre_rows or [])}

            kp_text = "## 知识库知识点（你可以详细讲解以下内容）\n"
            for k in kp_rows:
                prereq_names = [pre_name_map.get(pid, "") for pid in (k.get("prerequisites") or []) if pre_name_map.get(pid)]
                kp_text += f"\n### {k['name']}（{k.get('chapter','')}, 难度{k.get('difficulty','?')}）\n"
                if k.get("description"):
                    kp_text += f"简介：{k['description']}\n"
                if prereq_names:
                    kp_text += f"前置知识：{' → '.join(prereq_names)}\n"
            context_parts.append(kp_text)
            context_labels.append(f"知识库({len(kp_rows)}个知识点·带详情)")

        # 3. 学习记录统计
        session_rows = await select("learning_sessions", filters=f"student_id=eq.{req.student_id}&order=started_at.desc&limit=30&select=id,kp_id,cycle_number,pre_test_score,post_test_score,final_decision")
        if session_rows:
            total = len(session_rows)
            passed = sum(1 for s in session_rows if s.get("final_decision") in ("pass", "skip"))
            retried = sum(1 for s in session_rows if s.get("final_decision") == "retry")
            fused = sum(1 for s in session_rows if s.get("final_decision") == "fuse")

            # Per-KP stats
            kp_stats = {}
            for s in session_rows:
                kpid = s.get("kp_id", "")
                if kpid not in kp_stats:
                    kp_stats[kpid] = {"attempts": 0, "passed": False, "scores": []}
                kp_stats[kpid]["attempts"] += 1
                if s.get("final_decision") == "pass":
                    kp_stats[kpid]["passed"] = True
                if s.get("post_test_score") is not None:
                    kp_stats[kpid]["scores"].append(s["post_test_score"])

            # Get KP names
            kp_ids = list(kp_stats.keys())
            kp_name_map = {}
            if kp_ids:
                kp_rows2 = await select("knowledge_points", filters=f"id=in.({','.join(kp_ids)})&select=id,name")
                kp_name_map = {r["id"]: r["name"] for r in kp_rows2}

            stats_text = f"## 学习统计\n总计 {total} 次学习\n通过: {passed} | 重学: {retried} | 熔断: {fused}\n\n各知识点状态:\n"
            for kpid, st in kp_stats.items():
                name = kp_name_map.get(kpid, kpid[:8])
                status = "✅ 已掌握" if st["passed"] else "❌ 未掌握"
                avg = sum(st["scores"]) / len(st["scores"]) * 100 if st["scores"] else 0
                stats_text += f"- {name}: {status}（{st['attempts']}次, 均分{avg:.0f}%）\n"
            context_parts.append(stats_text)
            context_labels.append(f"学习记录({total}条)")

        # 4. 错题
        wrong_sessions = await select("learning_sessions", filters=f"student_id=eq.{req.student_id}&order=started_at.desc&limit=10&select=id,kp_id,pre_test_detail,post_test_detail")
        wrong_qids = set()
        for s in wrong_sessions:
            for key in ["pre_test_detail", "post_test_detail"]:
                detail = s.get(key) or []
                if isinstance(detail, list):
                    for r in detail:
                        if isinstance(r, dict) and not r.get("correct") and r.get("id"):
                            wrong_qids.add(r["id"])

        if wrong_qids:
            qids_list = list(wrong_qids)[:10]
            q_rows = await select("questions", filters=f"id=in.({','.join(qids_list)})&select=id,kp_id,question_text,type")
            # Get KP names for wrong questions
            wrong_kp_ids = list(set(q.get("kp_id", "") for q in q_rows if q.get("kp_id")))
            wrong_kp_map = {}
            if wrong_kp_ids:
                kp_r = await select("knowledge_points", filters=f"id=in.({','.join(wrong_kp_ids)})&select=id,name")
                wrong_kp_map = {r["id"]: r["name"] for r in kp_r}

            wrong_text = "## 错题记录\n" + "\n".join(
                f"- [{q.get('type','')}] {q['question_text'][:60]}...（{wrong_kp_map.get(q.get('kp_id',''), '未知')}）"
                for q in q_rows[:10]
            )
            context_parts.append(wrong_text)
            context_labels.append(f"错题({len(q_rows)}道)")

        # Build final context
        if not context_parts:
            context_parts.append("暂无学习数据。请先完成一些学习内容。")
            context_labels.append("无数据")

        full_context = "\n\n".join(context_parts)

        # Build conversation with history
        history_text = ""
        if req.history:
            history_text = "## 对话历史\n" + "\n".join(
                f"{'学生' if h['role'] == 'user' else '小薪'}: {h['content'][:200]}"
                for h in req.history[-6:]  # last 6 messages
            ) + "\n\n---\n\n"

        user_message = f"{history_text}以下是学生的学习数据：\n\n{full_context}\n\n---\n学生提问：{req.message}\n\n请根据以上数据回答。记住你是「小薪」。"

        reply = await async_llm.chat(SYSTEM_PROMPT, user_message, max_tokens=1024)

        return ChatResponse(reply=reply, context_used=context_labels)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
