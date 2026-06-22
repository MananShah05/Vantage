"""
Simple in-memory TTL cache.

Usage:
    cache = TTLCache(ttl_seconds=300)
    cache.set("key", value)
    value = cache.get("key")   # None if expired or missing
"""
import time
import threading
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int = 300):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (value, time.monotonic() + self._ttl)

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def keys(self) -> list[str]:
        with self._lock:
            now = time.monotonic()
            return [k for k, (_, exp) in self._store.items() if now <= exp]


# Singleton instances used by the application
returns_cache = TTLCache(ttl_seconds=300)   # 5-min cache for computed returns
history_cache = TTLCache(ttl_seconds=600)   # 10-min cache for raw OHLCV history
