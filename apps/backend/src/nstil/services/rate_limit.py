import time
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final, Protocol, cast, runtime_checkable

import redis.asyncio as aioredis

from nstil.observability import get_logger
from nstil.services.rate_limit_config import RateLimitTier

logger = get_logger("nstil.rate_limit")

KEY_PREFIX: Final[str] = "nstil:rl"

_EXPIRE_BUFFER_MS: Final[int] = 1000

_LUA_SLIDING_WINDOW: Final[str] = (
    """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local current_count = redis.call('ZCARD', key)

if current_count >= limit then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 0
    if #oldest > 0 then
        retry_after = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
        if retry_after < 1 then
            retry_after = 1
        end
    end
    return {0, current_count, retry_after}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window + """
    + str(_EXPIRE_BUFFER_MS)
    + """)

return {1, current_count + 1, 0}
"""
)


@runtime_checkable
class _RedisScript(Protocol):
    async def __call__(
        self,
        keys: Sequence[str],
        args: Sequence[object],
    ) -> list[int]: ...


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    retry_after: int
    reset_at: int


class RateLimitService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis
        self._script: _RedisScript | None = None

    async def _get_script(self) -> _RedisScript:
        if self._script is None:
            self._script = cast(
                _RedisScript,
                self._redis.register_script(_LUA_SLIDING_WINDOW),
            )
        return self._script

    async def check(self, key: str, tier: RateLimitTier) -> RateLimitResult:
        now_ms = int(time.time() * 1000)
        window_ms = tier.window_seconds * 1000
        member = f"{now_ms}:{uuid.uuid4().hex[:8]}"

        try:
            script = await self._get_script()
            result: list[int] = await script(
                keys=[key],
                args=[now_ms, window_ms, tier.max_requests, member],
            )
        except Exception:
            logger.warning("rate_limit.redis_unavailable", key=key)
            return RateLimitResult(
                allowed=True,
                limit=tier.max_requests,
                remaining=tier.max_requests,
                retry_after=0,
                reset_at=int(time.time()) + tier.window_seconds,
            )

        allowed = result[0] == 1
        current_count = result[1]
        retry_after = result[2]

        return RateLimitResult(
            allowed=allowed,
            limit=tier.max_requests,
            remaining=max(0, tier.max_requests - current_count),
            retry_after=retry_after,
            reset_at=int(time.time()) + tier.window_seconds,
        )

    @staticmethod
    def build_ip_key(ip: str) -> str:
        return f"{KEY_PREFIX}:ip:{ip}"

    @staticmethod
    def build_user_key(user_id: str) -> str:
        return f"{KEY_PREFIX}:user:{user_id}"

    @staticmethod
    def build_route_key(user_id: str, route_group: str) -> str:
        return f"{KEY_PREFIX}:user:{user_id}:{route_group}"
