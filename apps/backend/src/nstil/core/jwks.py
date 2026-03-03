from __future__ import annotations

import asyncio
import contextlib
import time

import httpx
import structlog
from jwt import PyJWK

logger = structlog.get_logger(__name__)

_RELOAD_COOLDOWN_SECONDS: float = 30.0


class JWKSKeyStore:
    _keys: dict[str, PyJWK]
    _supabase_url: str | None
    _last_reload_at: float
    _reload_lock: asyncio.Lock
    _refresh_task: asyncio.Task[None] | None

    def __init__(self) -> None:
        self._keys = {}
        self._supabase_url = None
        self._last_reload_at = 0.0
        self._reload_lock = asyncio.Lock()
        self._refresh_task = None

    async def load(self, supabase_url: str) -> None:
        self._supabase_url = supabase_url
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks_data: dict[str, list[dict[str, object]]] = response.json()

        self._keys = {}
        for key_data in jwks_data.get("keys", []):
            kid = str(key_data.get("kid", ""))
            if kid:
                self._keys[kid] = PyJWK.from_dict(key_data)

        self._last_reload_at = time.monotonic()
        logger.info("jwks.loaded", key_count=len(self._keys))

    async def get_key_or_reload(self, kid: str) -> PyJWK | None:
        key = self._keys.get(kid)
        if key is not None:
            return key

        if self._supabase_url is None:
            return None

        elapsed = time.monotonic() - self._last_reload_at
        if elapsed < _RELOAD_COOLDOWN_SECONDS:
            return None

        async with self._reload_lock:
            key = self._keys.get(kid)
            if key is not None:
                return key

            elapsed = time.monotonic() - self._last_reload_at
            if elapsed < _RELOAD_COOLDOWN_SECONDS:
                return None

            try:
                await self.load(self._supabase_url)
                logger.info("jwks.reloaded_on_miss", kid=kid)
            except Exception:
                logger.warning("jwks.reload_failed", kid=kid)
                return None

        return self._keys.get(kid)

    def get_key(self, kid: str) -> PyJWK | None:
        return self._keys.get(kid)

    @property
    def is_loaded(self) -> bool:
        return len(self._keys) > 0

    def start_background_refresh(self, interval_seconds: int) -> None:
        if self._refresh_task is not None:
            return
        self._refresh_task = asyncio.create_task(
            self._refresh_loop(interval_seconds),
        )

    async def stop_background_refresh(self) -> None:
        task = self._refresh_task
        if task is None:
            return
        self._refresh_task = None
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    async def _refresh_loop(self, interval_seconds: int) -> None:
        while True:
            await asyncio.sleep(interval_seconds)
            if self._supabase_url is None:
                continue
            try:
                await self.load(self._supabase_url)
            except Exception:
                logger.warning("jwks.background_refresh_failed")


jwks_store = JWKSKeyStore()
