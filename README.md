# 知薪 (ZhiXin) — 多智能体个性化学习平台

> 科大讯飞 · 企业真实业务命题 P30  
> 郑州西亚斯学院 · AI+X 精英班  
> **基于多智能体与大模型的高校个性化学习资源生成智能体**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com)

---

## 项目简介

知薪是一个面向高校课程的 AI 驱动个性化学习平台。它基于 **KSTAR 学习循环** 和 **多智能体协同架构**，为每位学生自动诊断知识盲区、生成个性化学习资源、并通过艾宾浩斯遗忘曲线安排科学复习——让学生真正"学会"而非"学过"。

**一句话：给每个学生配一个 AI 私教。**

---

## 核心创新

### 1. KSTAR 五步学习循环

```
┌─────────────────────────────────────────────────────┐
│  K (Knowledge)  前测诊断 → 精准定位已有知识          │
│  S (Status)     差距分析 → 找到"还差什么"            │
│  T (Target)     锁定目标 → 选定一个原子级知识点       │
│  A (Action)     AI 生成学习资源 → 学生自主学习        │
│  R (Reflection) 后测验证 → 过关则进入下一知识点       │
│                                                      │
│  ♻ 未达标自动重试 | 🔥 熔断机制：每知识点最多 2 轮   │
└─────────────────────────────────────────────────────┘
```

### 2. 三大技术亮点

| 亮点 | 说明 |
|------|------|
| **熔断机制** | 正确率 ≥ 80% 视为通过，每知识点最多循环 2 次，防止死循环 |
| **ReviewAgent 纯规则审核** | 不靠 LLM 判断质量，用可解释规则做版权+质量双层过滤 |
| **断言式评分** | 案例实战中，LLM 只叙事不评分，正确答案通过 HTML 注释标记，后端正则提取比对——杜绝 LLM 幻觉 |

---

## 功能模块

### 🎓 学生学习端 (9 大模块)

| 模块 | 功能 | 亮点 |
|------|------|------|
| **学习中心** | KSTAR 五步循环：前测→诊断→锁定→AI生成→后测 | 全自动流程，无需手动操作 |
| **知识库** | 课程知识树，前置依赖可视化 | 先修知识不达标自动拦截 |
| **AI 助教** | 知识库增强的智能问答 | 回答有理有据，可溯源到具体知识点 |
| **案例实战** | 分支剧情式案例模拟 | 扮演角色做决策，AI 实时推演后果 |
| **费曼讲台** | "教给别人"学习法 | 学生向 AI 讲解知识点，AI 追问并评分 |
| **错题本** | 自动收集错题，标注来源 | 按知识点分类，支持针对性复习 |
| **学习记录** | 完整学习历史，可视化进度 | 每轮循环的得分、耗时、路径追踪 |
| **复习提醒** | 艾宾浩斯遗忘曲线驱动 | 学习后 1天/3天/7天 自动提醒复习 |
| **认知画像** | 三维学生画像（知识掌握/学习风格/能力倾向） | 驱动个性化资源生成 |

### 👨‍🏫 教师端 (5 大功能)

| 功能 | 说明 |
|------|------|
| 学生总览 | 查看所有学生的学习进度和画像 |
| 学习监控 | 实时追踪每位学生的 KSTAR 循环状态 |
| 复习统计 | 全班复习完成率、正确率分布 |
| 章节难度 | 基于学生后测数据反推各章节教学难度 |
| 每日统计 | 日活跃学生数、完成资源数等运营指标 |

---

## 技术架构

```
┌──────────────────────────────────────────────────────┐
│                      前端 (Vercel)                    │
│              Next.js 15 + Tailwind CSS               │
│   10 页面 · SSE 流式 · 响应式 · Dark Mode            │
├──────────────────────────────────────────────────────┤
│                      后端 (Render)                    │
│                 FastAPI + Uvicorn                     │
│   14 API 路由 · 7 个 AI Agent · 异步架构              │
├──────────────────────────────────────────────────────┤
│                    LLM 层 (可插拔)                     │
│   DeepSeek v3/reasoner · 讯飞星火 · OpenAI · Groq    │
├──────────────────────────────────────────────────────┤
│                   数据库 (Supabase)                    │
│          PostgreSQL · REST API · RLS 安全策略          │
└──────────────────────────────────────────────────────┘
```

### 7 个 AI Agent

| Agent | 阶段 | 职责 |
|-------|------|------|
| `diagnostic` | K 阶段 | 分析前测结果，诊断知识掌握情况 |
| `gap_analyzer` | S+T 阶段 | 计算与目标的差距，选定攻克知识点 |
| `resource_gen` | A 阶段 | 生成个性化学习材料（讲义/案例/题目） |
| `resource_external` | A 阶段 | 搜索外部高质量资源补充 |
| `reflection` | R 阶段 | 分析后测结果，判断是否达标 |
| `review_agent` | 审核 | 纯规则审核生成内容的质量与版权 |
| `format_convert` | 辅助 | 格式转换与标准化输出 |

---

## 数据库设计

核心表结构（完整 SQL 见 `migration_v2.sql`）：

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `case_study_scenarios` | 案例场景定义 | slug, role_play, system_prompt, max_steps |
| `case_study_sessions` | 学生案例会话 | conversation(JSONB), decisions(JSONB), correct_count |
| `review_logs` | 艾宾浩斯复习记录 | interval_day(1/3/7), score |

> 完整的数据模型还包含知识库(knowledge_points)、用户画像(profiles)、学习记录(sessions)等表，基于 Supabase 管理。

---

## 部署指南

> ⚠️ **必须先部署后端，再部署前端**。前端构建时需要后端地址。

### 第一步：部署后端到 Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Detachment5879/zhi-xin)

1. 点击上方按钮，Render 会自动读取 `render.yaml`
2. 填写环境变量（Supabase 密钥 + LLM API Key）
3. 等待部署完成（约 3-5 分钟）
4. 复制生成的地址，如 `https://zhixin-api.onrender.com`

验证：访问 `https://你的地址/docs` 查看 API 文档

### 第二步：部署前端到 Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Detachment5879/zhi-xin&root-directory=frontend)

1. 点击上方按钮，Vercel 会引导你导入仓库
2. **在环境变量设置页面，填入：**
   - `BACKEND_URL` = 第一步复制的 Render 地址（如 `https://zhixin-api.onrender.com`）
3. 点击 Deploy，等待构建完成（约 2-3 分钟）

> 💡 如果忘记设置 BACKEND_URL，部署后前端 API 请求会失败。去 Vercel 项目 Settings → Environment Variables 添加后重新部署即可。

---

## 本地开发

### 环境要求

- Python 3.10+
- Node.js 18+
- Supabase 项目（免费套餐即可）

### 1. 克隆仓库

```bash
git clone https://github.com/Detachment5879/zhi-xin.git
cd zhi-xin
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入你的 Supabase 密钥和 LLM API Key
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API 文档自动生成：http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:3000

### 4. 初始化数据库

在 Supabase SQL Editor 中依次执行：
1. `migration_v2.sql` — 建表 + 种子数据
2. `setup_org.sql` — 组织架构
3. `fix_scenario_prompt.sql` — 案例内容修复（如有）

---

## 环境变量

### 后端 (`backend/.env`)

| 变量 | 说明 | 示例 |
|------|------|------|
| `SUPABASE_URL` | Supabase 项目地址 | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service Role Key | `eyJ...` |
| `SUPABASE_ANON_KEY` | Anon Key | `eyJ...` |
| `LLM_PROVIDER` | LLM 提供商 | `deepseek` / `spark` / `openai` / `groq` |
| `LLM_MODEL` | 模型名 | `deepseek-chat` / `deepseek-reasoner` |
| `LLM_API_KEY` | API 密钥 | `sk-...` |
| `LLM_BASE_URL` | API 地址 | `https://api.deepseek.com/v1` |
| `PASS_THRESHOLD` | 通过阈值 | `0.80` |
| `MAX_CYCLES` | 最大循环次数 | `2` |

### 前端 (Vercel 环境变量)

| 变量 | 说明 |
|------|------|
| `BACKEND_URL` | 后端 Render 地址，如 `https://zhixin-api.onrender.com` |

---

## 项目结构

```
zhi-xin/
├── backend/                        # FastAPI 后端
│   ├── app/
│   │   ├── api/                    # 14 个 API 路由模块
│   │   │   ├── case_study.py       #   案例实战 (4 endpoints)
│   │   │   ├── chat.py             #   AI 助教问答
│   │   │   ├── cycle.py            #   KSTAR 学习循环 (6 endpoints)
│   │   │   ├── diagnostic.py       #   诊断评估
│   │   │   ├── feynman.py          #   费曼讲台
│   │   │   ├── knowledge.py        #   知识库
│   │   │   ├── profile.py          #   认知画像
│   │   │   ├── progress.py         #   学习进度
│   │   │   ├── records.py          #   学习记录
│   │   │   ├── review.py           #   内容审核
│   │   │   ├── review_reminder.py  #   复习提醒 (3 endpoints)
│   │   │   ├── teacher.py          #   教师端 (7 endpoints)
│   │   │   └── org.py              #   组织架构
│   │   ├── agents/                 # 7 个 AI Agent
│   │   ├── services/               # 共享服务（LLM客户端、编排器、审计）
│   │   ├── models/                 # 数据模型
│   │   ├── config.py               # 配置管理
│   │   ├── database.py             # Supabase REST 客户端
│   │   ├── cache.py                # 内存缓存
│   │   └── main.py                 # 应用入口
│   └── requirements.txt
├── frontend/                       # Next.js 前端
│   └── src/
│       ├── app/                    # 10 个页面
│       │   ├── dashboard/          #   首页仪表盘
│       │   ├── knowledge/          #   知识库
│       │   ├── chat/               #   AI 助教
│       │   ├── case-study/         #   案例实战
│       │   ├── feynman/            #   费曼讲台
│       │   ├── history/            #   学习记录
│       │   ├── wrong-answers/      #   错题本
│       │   ├── profile/            #   画像设置
│       │   ├── settings/           #   系统设置
│       │   └── teacher/            #   教师端
│       └── components/             # 可复用组件
│           ├── Sidebar.tsx         #   侧边栏导航
│           ├── ChatBubble.tsx      #   对话气泡
│           ├── CognitiveRadar.tsx  #   雷达图
│           ├── Markdown.tsx        #   Markdown 渲染
│           ├── MindMapViewer.tsx   #   思维导图
│           ├── ReviewModal.tsx     #   复习弹窗
│           └── ReviewReminderCard.tsx  # 复习提醒卡片
├── migration_v2.sql                # 数据库迁移
├── setup_org.sql                   # 组织架构初始化
├── render.yaml                     # Render 一键部署配置
└── docker-compose.yml              # Docker 编排
```

---

## 技术栈

| 层 | 技术 | 选型理由 |
|----|------|----------|
| 前端框架 | Next.js 15 (App Router) | SSR + 静态生成，SEO 友好 |
| UI 框架 | Tailwind CSS + Lucide Icons | 原子化 CSS，快速迭代 |
| 后端框架 | FastAPI | 异步高性能，自动 API 文档 |
| 数据库 | Supabase (PostgreSQL) | 托管数据库 + REST API + RLS |
| LLM 网关 | 可插拔（DeepSeek/Spark/OpenAI/Groq） | OpenAI 兼容接口，一套代码多模型 |
| 流式输出 | SSE (Server-Sent Events) | 实时推送 AI 生成内容，无需 WebSocket |
| 部署 | Render + Vercel | 免费套餐即可，一键部署 |
| 容器化 | Docker + docker-compose | 环境一致性 |

---

## 测试

（即将补充）

> 核心路径验证记录请参考 `tests/verification_record.md`（从 kstar-learning-agent 仓库迁移中）

---

## 团队

| 成员 | 职责 |
|------|------|
| 邵逸飞 (Romantic) | 项目负责人 · KSTAR 架构设计 · Agent 开发 · SSE 流式 · 设计系统 |
| 张浩 | 前端全栈开发 · Next.js 15 主线 · 知识库（10课832节点） · EduAgent v7.28 |
| 尹振宇 | 测试 · 文档 |

---

## 相关仓库

- [kstar-learning-agent](https://github.com/Detachment5879/kstar-learning-agent) — Streamlit 原型，含完整的 KSTAR 循环验证和设计文档

---

## 开源协议

MIT License · 详见 [LICENSE](LICENSE)

---

*Built with ❤️ by SIAS AI+X Elite Class · Group 13*
