-- ============================================================
-- 知薪 — 案例实战 & 艾宾浩斯复习 数据库迁移
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- ==================================================
-- 1. 案例场景定义表
-- ==================================================
CREATE TABLE IF NOT EXISTS case_study_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    difficulty INT DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
    description TEXT,
    role_play TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    max_steps INT DEFAULT 8,
    knowledge_points UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================================================
-- 2. 案例会话表
-- ==================================================
CREATE TABLE IF NOT EXISTS case_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    scenario_id UUID NOT NULL REFERENCES case_study_scenarios(id),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    current_step INT DEFAULT 0,
    conversation JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    correct_count INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_sessions_student ON case_study_sessions(student_id, status);

-- ==================================================
-- 3. 复习记录表
-- ==================================================
CREATE TABLE IF NOT EXISTS review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    kp_id UUID NOT NULL,
    source_session_id UUID,
    interval_day INT NOT NULL CHECK (interval_day IN (1, 3, 7)),
    score REAL CHECK (score >= 0 AND score <= 1),
    reviewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, kp_id, interval_day)
);

CREATE INDEX IF NOT EXISTS idx_review_logs_student ON review_logs(student_id);

-- ==================================================
-- 种子数据：CFR 纺织品出口纠纷
-- ==================================================
INSERT INTO case_study_scenarios (slug, title, difficulty, description, role_play, system_prompt, max_steps)
VALUES (
    'cfr-textile-001',
    'CFR 纺织品出口纠纷',
    2,
    '你是浙江恒达纺织的单证员小李。公司签了一笔 CFR New York 的合同，货物价值 $50,000，已装船出运。突然收到船公司通知：货物在海运途中遭遇风暴，部分受损。现在美国买方发来邮件要求你赔偿全部损失。你需要在 8 步内妥善处理这场危机。',
    '你叫小李，是浙江恒达纺织品出口公司的单证员，入职两年。今天早上打开邮箱，一封来自美国客户 Michael 的邮件让你心头一紧——货船在太平洋上遭遇了风暴，部分纺织品泡了海水。Michael 要求你方赔偿全部损失 $50,000。你想起大学时学过的国际贸易实务，但手头是第一次遇到真事。',
    '你是一个国际贸易案例模拟系统，扮演"场景导演"。学生扮演浙江恒达纺织的单证员小李。

## 你的职责
- 根据学生选择推进剧情
- 在每个决策节点给出 2-4 个选项
- 选项必须用 [A] [B] [C] [D] 格式，每个选项一行
- 在每个节点末尾用 <!-- correct:X --> 标记正确答案（X 为 A/B/C/D），不展示给学生
- 叙事要生动，200字以内，让学生感受到真实职场压力

## 剧情线
1. 收到买方索赔邮件 → 你怎么回复？
2. 买方坚持索赔，搬出合同条款 → 你怎么应对？
3. 船公司发来货损报告 → 你看报告发现什么关键信息？
4. 买方提出"要么赔钱，要么以后别合作了" → 你怎么决策？
5. 保险公司介入 → 你需要准备什么材料？
6. 发现货损可能有"共同海损"成分 → 你怎么判断？
7. 买方态度软化，愿意协商 → 你怎么给出最终方案？
8. 案件收尾 → 复盘整个事件

## 评分标准（内置于剧情中）
- 正确识别 CFR 风险划分规则（装运港船上） +1
- 正确处理保险索赔流程 +1
- 正确应对商业谈判压力 +1
- 了解不可抗力与免责条款 +1
- 了解共同海损概念 +1

## 输出格式（严格）
{一段剧情叙述文字，不超过200字}

[A] 选项A的具体描述
[B] 选项B的具体描述
[C] 选项C的具体描述
<!-- correct:A -->',
    8
);

-- 验证
SELECT id, slug, title, status FROM case_study_scenarios;
