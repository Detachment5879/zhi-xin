"""数据库工具 — Supabase REST API 客户端"""

import httpx
from app.config import settings

BASE_URL = f"{settings.supabase_url}/rest/v1"
HEADERS = {
    "apikey": settings.supabase_service_key,
    "Authorization": f"Bearer {settings.supabase_service_key}",
    "Content-Type": "application/json",
}


async def query(
    table: str,
    method: str = "GET",
    params: dict | None = None,
    json_data: dict | None = None,
    filters: str = "",
    extra_headers: dict | None = None,
) -> httpx.Response:
    """通用 Supabase REST API 请求"""
    url = f"{BASE_URL}/{table}"
    if filters:
        url += f"?{filters}"
    headers = {**HEADERS}
    if extra_headers:
        headers.update(extra_headers)
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.request(method, url, headers=headers, params=params, json=json_data)
    return r


async def select(table: str, columns: str = "*", filters: str = "") -> list:
    """查询记录。如果 filters 中已有 select，则不再追加"""
    if "select=" not in filters:
        sep = "&" if filters else ""
        filters = f"{filters}{sep}select={columns}"
    r = await query(table, filters=filters)
    r.raise_for_status()
    return r.json()


async def insert(table: str, data: dict | list) -> list:
    """插入记录，返回插入的数据"""
    r = await query(table, method="POST", json_data=data, extra_headers={"Prefer": "return=representation"})
    r.raise_for_status()
    return r.json()


async def update(table: str, filters: str, data: dict) -> list:
    """更新记录"""
    r = await query(table, method="PATCH", filters=filters, json_data=data, extra_headers={"Prefer": "return=representation"})
    r.raise_for_status()
    return r.json()


async def delete(table: str, filters: str) -> list:
    """删除记录"""
    r = await query(table, method="DELETE", filters=filters, extra_headers={"Prefer": "return=representation"})
    r.raise_for_status()
    return r.json()
