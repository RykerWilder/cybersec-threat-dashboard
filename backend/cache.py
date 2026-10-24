"""Small in-memory async cache used to protect the upstream APIs.

- TTL: a value is reused until it expires.
- Request coalescing: concurrent requests for the same key share one upstream call.
- Stale on error: if refreshing fails (rate limit, outage) the last good value is
  served and the next refresh attempt is delayed, instead of hammering the API.
"""
import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, Dict, Tuple

logger = logging.getLogger("threat-dashboard.cache")


class TTLCache:
    def __init__(self, clock: Callable[[], float] = time.monotonic, error_backoff: float = 30.0):
        self._clock = clock
        self._error_backoff = error_backoff
        self._entries: Dict[str, Tuple[float, Any]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

    async def get_or_fetch(
        self,
        key: str,
        ttl: float,
        fetch: Callable[[], Awaitable[Any]],
    ) -> Any:
        entry = self._entries.get(key)
        if entry and entry[0] > self._clock():
            return entry[1]

        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            # Another request may have refreshed the value while we waited.
            entry = self._entries.get(key)
            if entry and entry[0] > self._clock():
                return entry[1]

            try:
                value = await fetch()
            except Exception as exc:
                if entry is None:
                    raise
                logger.warning("Refreshing '%s' failed (%s); serving stale data", key, exc)
                self._entries[key] = (self._clock() + self._error_backoff, entry[1])
                return entry[1]

            self._entries[key] = (self._clock() + ttl, value)
            return value
