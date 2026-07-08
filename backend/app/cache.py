"""简易内存缓存 — 减少重复的数据库查询"""
import time
from typing import Any

_cache: dict[str, tuple[float, Any]] = {}

def get(key: str, ttl: int = 30) -> Any | None:
    """读取缓存，ttl 秒内有效"""
    if key in _cache:
        ts, val = _cache[key]
        if time.time() - ts < ttl:
            return val
        del _cache[key]
    return None

def set(key: str, val: Any) -> None:
    _cache[key] = (time.time(), val)

def clear() -> None:
    _cache.clear()
