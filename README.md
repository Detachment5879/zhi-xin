# 知薪 (KSTAR) - 多智能体学习平台

## 一键部署

### 后端 → Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Detachment5879/zhi-xin)

### 前端 → Vercel
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/Detachment5879/zhi-xin&root-directory=frontend)

## 环境变量

部署时需要设置以下环境变量：
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_ANON_KEY` - Supabase 项目密钥
- `LLM_API_KEY` / `LLM_BASE_URL` - DeepSeek API 配置
- `BACKEND_URL` - 后端地址（仅前端需要，格式: https://xxx.onrender.com）
