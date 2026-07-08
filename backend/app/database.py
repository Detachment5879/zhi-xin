"""
数据库工具 — 本地 SQLite，零外部依赖

用法：
  from app.database import select, insert, update, db_delete

SQLite 文件自动创建在 backend/data/zhixin.db
启动时自动建表，首次使用自动导入种子数据
"""

import sqlite3
import json
import asyncio
import os
import threading
from pathlib import Path
from app.config import settings

# ── 数据库路径 ──────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = str(DATA_DIR / "zhixin.db")

# 线程本地连接（每个线程一个连接，线程安全）
_local = threading.local()

# JSON 字段名集合（自动序列化/反序列化）
JSON_COLUMNS = {
    "conversation", "decisions",
    "pre_test_detail", "post_test_detail",
    "review_details", "options",
    "prerequisites", "knowledge_points",
}


def _get_conn() -> sqlite3.Connection:
    """获取当前线程的数据库连接"""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def _init_db():
    """首次启动时创建表 + 种子数据"""
    conn = _get_conn()
    
    # 检查是否已初始化
    row = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_points'").fetchone()
    if row:
        return  # 已初始化

    conn.executescript("""
        CREATE TABLE IF NOT EXISTS knowledge_points (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            chapter TEXT DEFAULT '',
            difficulty INTEGER DEFAULT 1,
            description TEXT DEFAULT '',
            prerequisites TEXT DEFAULT '[]',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS learning_sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            kp_id TEXT NOT NULL,
            cycle_number INTEGER DEFAULT 1,
            pre_test_score REAL,
            post_test_score REAL,
            final_decision TEXT DEFAULT '',
            target TEXT DEFAULT '',
            pre_test_detail TEXT DEFAULT '[]',
            post_test_detail TEXT DEFAULT '[]',
            started_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS student_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            display_name TEXT DEFAULT '',
            student_number TEXT DEFAULT '',
            cognitive_style TEXT DEFAULT '',
            learning_goal TEXT DEFAULT '',
            explanation_style TEXT DEFAULT '',
            survey_completed INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            kp_id TEXT NOT NULL,
            question_text TEXT NOT NULL,
            type TEXT DEFAULT 'single_choice',
            options TEXT DEFAULT '[]',
            correct_answer TEXT DEFAULT '',
            explanation TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS resource_generations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            kp_id TEXT NOT NULL,
            resource_type TEXT DEFAULT '',
            content TEXT DEFAULT '',
            review_score REAL,
            review_details TEXT DEFAULT '[]',
            review_passed INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS case_study_scenarios (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            difficulty INTEGER DEFAULT 2,
            description TEXT DEFAULT '',
            role_play TEXT DEFAULT '',
            system_prompt TEXT DEFAULT '',
            max_steps INTEGER DEFAULT 8,
            knowledge_points TEXT DEFAULT '[]',
            status TEXT DEFAULT 'published'
        );

        CREATE TABLE IF NOT EXISTS case_study_sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            status TEXT DEFAULT 'in_progress',
            current_step INTEGER DEFAULT 0,
            conversation TEXT DEFAULT '[]',
            decisions TEXT DEFAULT '[]',
            correct_count INTEGER DEFAULT 0,
            started_at TEXT DEFAULT (datetime('now')),
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS review_logs (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            kp_id TEXT NOT NULL,
            source_session_id TEXT,
            interval_day INTEGER NOT NULL,
            score REAL,
            reviewed_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS majors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department_id TEXT
        );

        CREATE TABLE IF NOT EXISTS classes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            major_id TEXT
        );

        CREATE TABLE IF NOT EXISTS class_students (
            id TEXT PRIMARY KEY,
            class_id TEXT,
            student_id TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            agent_name TEXT DEFAULT '',
            phase TEXT DEFAULT '',
            input_summary TEXT DEFAULT '',
            output_summary TEXT DEFAULT '',
            llm_model TEXT DEFAULT '',
            duration_ms REAL DEFAULT 0,
            error TEXT DEFAULT '',
            session_id TEXT DEFAULT '',
            student_id TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)

    # ── 种子数据 ──
    # CFR 案例场景
    conn.execute("""
        INSERT OR IGNORE INTO case_study_scenarios (slug, title, difficulty, description, role_play, system_prompt, max_steps)
        VALUES (
            'cfr-textile-001',
            'CFR 纺织品出口纠纷',
            2,
            '你是浙江恒达纺织的单证员小李。公司签了一笔 CFR New York 的合同，货物价值 $50,000，已装船出运。突然收到船公司通知：货物在海运途中遭遇风暴，部分受损。现在美国买方发来邮件要求你赔偿全部损失。你需要在 8 步内妥善处理这场危机。',
            '你叫小李，是浙江恒达纺织品出口公司的单证员，入职两年。今天早上打开邮箱，一封来自美国客户 Michael 的邮件让你心头一紧——货船在太平洋上遭遇了风暴，部分纺织品泡了海水。Michael 要求你方赔偿全部损失 $50,000。你想起大学时学过的国际贸易实务，但手头是第一次遇到真事。',
            '你是一个国际贸易案例模拟系统，扮演"场景导演"。学生扮演浙江恒达纺织的单证员小李。\n\n## 场景设定\n学生扮演浙江恒达纺织品出口公司的单证员"小李"，入职两年。公司签了一笔 CFR New York 的合同，货物为纺织品，价值 USD $50,000。货物已装船出运。某天收到船公司通知：货船在太平洋上遭遇风暴，部分货物泡了海水受损。美国客户 Michael 发来邮件要求赔偿全部损失。\n\n## 你的职责\n1. 根据学生的每一步选择推进剧情\n2. 在每个决策节点给出 2-4 个选项，选项必须用 [A] [B] [C] [D] 格式，每行一个\n3. 在末尾用 <!-- correct:X --> 标记正确答案（X 为 A/B/C/D），这个标记不展示给学生\n4. 叙事要生动、有紧张感，每次输出不超过 200 字\n5. 学生选错时不要说"你错了"，而是让剧情自然展示错误后果\n6. 对话进行到第 8 步时强制结束，让系统给出复盘\n\n## 8 步剧情线\n第 1 步：收到买方索赔邮件，要求立刻赔偿全部 $50,000。你怎么回复？\n第 2 步：买方回邮件说"什么 CFR 不 CFR，我付了钱货没到你就得赔"，语气强硬。\n第 3 步：船公司发来了货损报告和海事的天气报告。\n第 4 步：买方威胁"要么赔钱，要么以后别合作了"。你的老板也开始紧张。\n第 5 步：保险公司介入，你需要准备理赔材料。\n第 6 步：保险调查中发现，船长在风暴中为了保全整船货物，主动抛弃了部分集装箱——可能构成"共同海损"。\n第 7 步：买方态度软化，愿意协商。你怎么给出最终方案？\n第 8 步：案件收尾。总结这次事件的经验教训。\n\n## 输出格式（每次必须严格遵循）\n{一段剧情叙述文字}\n\n[A] 选项A的具体描述\n[B] 选项B的具体描述\n[C] 选项C的具体描述\n[D] 选项D的具体描述\n<!-- correct:X -->\n\n## 注意事项\n- 选项要具体可操作，不要抽象\n- 每个选项都要引导学生思考贸易实务知识\n- 错误选项要"看起来有道理但实际会出问题"\n- 不要在叙事中暴露正确答案\n- 开场白要先自我介绍角色，然后描述收邮件的情景，最后给出第一批选项',
            8
        )
    """)

    # 组织架构
    conn.execute("INSERT OR IGNORE INTO departments (id, name) VALUES ('d0000000-0000-0000-0000-000000000001', '商学院')")
    conn.execute("INSERT OR IGNORE INTO majors (id, name, department_id) VALUES ('m0000000-0000-0000-0000-000000000001', '国际贸易实务', 'd0000000-0000-0000-0000-000000000001')")
    conn.execute("INSERT OR IGNORE INTO classes (id, name, major_id) VALUES ('c0000000-0000-0000-0000-000000000001', '国贸2301', 'm0000000-0000-0000-0000-000000000001')")
    conn.execute("INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES ('cs000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')")

    conn.commit()


def _parse_filters(filters: str) -> tuple[str, list]:
    """
    解析 Supabase 风格过滤器为 SQL WHERE + ORDER + LIMIT + params。

    支持:
      column=eq.value          → WHERE column = ?
      column=in.(a,b,c)        → WHERE column IN (?,?,?)
      order=column.asc         → ORDER BY column ASC
      order=column.desc        → ORDER BY column DESC
      limit=N                  → LIMIT ?
    """
    if not filters:
        return "", []

    where_parts = []
    order_clause = ""
    limit_clause = ""
    params = []

    for part in filters.split("&"):
        part = part.strip()
        if not part:
            continue

        # limit
        if part.startswith("limit="):
            try:
                limit_val = int(part[6:])
                limit_clause = f"LIMIT ?"
                params.append(limit_val)
            except ValueError:
                pass
            continue

        # order
        if part.startswith("order="):
            order_val = part[6:]
            if order_val.endswith(".desc"):
                col = order_val[:-5]
                order_clause = f"ORDER BY {col} DESC"
            elif order_val.endswith(".asc"):
                col = order_val[:-4]
                order_clause = f"ORDER BY {col} ASC"
            continue

        # select= (handled separately)
        if part.startswith("select="):
            continue

        # eq
        if ".eq." in part:
            col, val = part.split(".eq.", 1)
            where_parts.append(f"{col} = ?")
            params.append(val)
            continue

        # in
        if ".in.(" in part:
            col, rest = part.split(".in.(", 1)
            vals_str = rest.rstrip(")")
            vals = [v.strip() for v in vals_str.split(",") if v.strip()]
            placeholders = ",".join(["?"] * len(vals))
            where_parts.append(f"{col} IN ({placeholders})")
            params.extend(vals)
            continue

    where_clause = ""
    if where_parts:
        where_clause = "WHERE " + " AND ".join(where_parts)

    return f"{where_clause} {order_clause} {limit_clause}".strip(), params


def _extract_select_columns(filters: str, default: str = "*") -> str:
    """从 filters 中提取 select= 子句"""
    for part in filters.split("&"):
        part = part.strip()
        if part.startswith("select="):
            return part[7:]
    return default


def _serialize_row(row: sqlite3.Row) -> dict:
    """将 SQLite Row 转为 dict，自动反序列化 JSON 字段"""
    d = dict(row)
    for key, val in d.items():
        if key in JSON_COLUMNS and isinstance(val, str):
            try:
                d[key] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                pass
    return d


def _serialize_data(data: dict) -> dict:
    """序列化数据中的 JSON 字段为字符串"""
    result = {}
    for key, val in data.items():
        if key in JSON_COLUMNS and isinstance(val, (dict, list)):
            result[key] = json.dumps(val, ensure_ascii=False)
        elif isinstance(val, (dict, list)):
            result[key] = json.dumps(val, ensure_ascii=False)
        else:
            result[key] = val
    return result


# ── 公共接口（和之前完全一样） ──

async def select(table: str, columns: str = "*", filters: str = "") -> list[dict]:
    """查询记录"""
    _init_db()

    actual_columns = _extract_select_columns(filters, columns)
    where_sql, params = _parse_filters(filters)

    sql = f"SELECT {actual_columns} FROM {table} {where_sql}"

    def _run():
        conn = _get_conn()
        rows = conn.execute(sql, params).fetchall()
        return [_serialize_row(r) for r in rows]

    return await asyncio.get_event_loop().run_in_executor(None, _run)


async def insert(table: str, data: dict | list) -> list[dict]:
    """插入记录，返回插入的数据"""
    _init_db()

    if isinstance(data, dict):
        data = [data]

    serialized = [_serialize_data(d) for d in data]

    def _run():
        conn = _get_conn()
        results = []
        for d in serialized:
            # 生成 UUID（如果没有 id）
            if "id" not in d:
                import uuid
                d["id"] = str(uuid.uuid4())

            columns = ",".join(d.keys())
            placeholders = ",".join(["?"] * len(d))
            values = list(d.values())

            sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            conn.execute(sql, values)
            conn.commit()

            # 查询刚插入的行
            row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (d["id"],)).fetchone()
            if row:
                results.append(_serialize_row(row))
            else:
                results.append(d)

        return results

    return await asyncio.get_event_loop().run_in_executor(None, _run)


async def update(table: str, filters: str, data: dict) -> list[dict]:
    """更新记录，返回更新后的数据"""
    _init_db()

    serialized = _serialize_data(data)
    where_sql, where_params = _parse_filters(filters)

    set_parts = []
    set_params = []
    for key, val in serialized.items():
        set_parts.append(f"{key} = ?")
        set_params.append(val)

    all_params = set_params + where_params

    def _run():
        conn = _get_conn()
        sql = f"UPDATE {table} SET {', '.join(set_parts)} {where_sql}"
        conn.execute(sql, all_params)

        # 查询更新后的行
        select_sql = f"SELECT * FROM {table} {where_sql}"
        rows = conn.execute(select_sql, where_params).fetchall()
        conn.commit()
        return [_serialize_row(r) for r in rows]

    return await asyncio.get_event_loop().run_in_executor(None, _run)


async def db_delete(table: str, filters: str) -> list[dict]:
    """删除记录"""
    _init_db()

    where_sql, params = _parse_filters(filters)

    def _run():
        conn = _get_conn()
        # 先查再删
        rows = conn.execute(f"SELECT * FROM {table} {where_sql}", params).fetchall()
        result = [_serialize_row(r) for r in rows]
        conn.execute(f"DELETE FROM {table} {where_sql}", params)
        conn.commit()
        return result

    return await asyncio.get_event_loop().run_in_executor(None, _run)


# 别名兼容
delete = db_delete
