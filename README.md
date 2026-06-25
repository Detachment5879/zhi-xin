# 知薪 (ZhiXin) — 基于多智能体与大模型的高校个性化学习资源生成智能体

> **P30 · 科大讯飞命题** | AI+X 精英班 Group 13 | 郑州西亚斯学院

知薪是一个个性化学习资源生成平台。每个学生通过前测诊断薄弱点，AI 多智能体协作实时生成定制化学习资源——「一人一课表」。

## 核心特性

- **KSTAR 五阶段闭环**：K 前测 → S 搜索 → T 分析 → A 生成 → R 后测
- **成本可控**：熔断机制 + 预测试跳过 + 原子知识粒度，单次学习成本 < 0.1 元
- **ReviewAgent**：6 条确定性规则（零 LLM 调用）审核生成质量
- **10 大功能模块**：知识库 / 个性化学习 / AI 助教 / 费曼讲台 / 案例实战 / 复习提醒 / 错题本 / 学习记录 / 画像设置 / 教师端

## 技术栈

```
浏览器 → Next.js 15 (TypeScript) → FastAPI (Python) → Supabase (PostgreSQL)
```

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 15 + Tailwind CSS | SSE 流式渲染，教育风设计系统 |
| 后端 | FastAPI + Python 3.14 | 18 个 REST API，7 个 AI Agent |
| 数据库 | Supabase (PostgreSQL) | 22 章 86 知识点 244 试题 |
| AI 模型 | DeepSeek V3 / R1 | 支持多 Provider 切换 |

## 快速开始

### 前置要求
- Python 3.11+
- Node.js 18+
- Supabase 项目

### 后端

```bash
cd backend
cp .env.example .env   # 编辑填入你的 Supabase 和 LLM 密钥
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
kstar-platform/
├── backend/           # FastAPI 后端
│   ├── app/
│   │   ├── api/       # 18 个 API 路由
│   │   ├── agents/    # 7 个 AI Agent
│   │   ├── services/  # LLM 客户端等
│   │   └── main.py    # 入口
│   └── requirements.txt
├── frontend/          # Next.js 前端
│   └── src/
│       ├── app/       # 10 个页面模块
│       └── components/
├── migration_v2.sql   # 数据库迁移脚本
└── start.bat          # Windows 一键启动
```

## 团队

| 成员 | 角色 | 负责 |
|---|---|---|
| 邵逸飞（Romantic） | 项目负责人 | 架构 · Agent 逻辑 · 产品方向 |
| 张浩 | 全栈开发 | Next.js 前端 · 知识库 |
| 尹振宇 | 测试 & 文档 | 功能测试 · Bug 跟踪 · 文档 |

## 许可证

MIT
