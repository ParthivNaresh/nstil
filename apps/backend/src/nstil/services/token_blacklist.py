from typing import Final

import redis.asyncio as aioredis

from nstil.observability import get_logger

logger = get_logger("nstil.token_blacklist")

KEY_PREFIX: Final[str] = "nstil:blacklist"

_MIN_TTL_SECONDS: Final[int] = 1


class TokenBlacklistService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis

    async def revoke(self, session_id: str, ttl_seconds: int) -> None:
        key = self._build_key(session_id)
        effective_ttl = max(ttl_seconds, _MIN_TTL_SECONDS)
        try:
            await self._redis.setex(key, effective_ttl, b"1")
        except Exception:
            logger.warning("token_blacklist.revoke_failed", session_id=session_id)

    async def is_revoked(self, session_id: str) -> bool:
        key = self._build_key(session_id)
        try:
            result: int = await self._redis.exists(key)
            return result > 0
        except Exception:
            logger.warning("token_blacklist.check_failed", session_id=session_id)
            return False

    @staticmethod
    def _build_key(session_id: str) -> str:
        return f"{KEY_PREFIX}:{session_id}"
