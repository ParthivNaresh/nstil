from typing import TypeVar

import redis.asyncio as aioredis
from pydantic import BaseModel

from nstil.observability import get_logger
from nstil.services.cache.constants import SCAN_BATCH_SIZE

logger = get_logger("nstil.cache")

T = TypeVar("T", bound=BaseModel)


class BaseCacheService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis

    async def _get(self, key: str) -> str | None:
        try:
            result: str | None = await self._redis.get(key)
            return result
        except Exception:
            logger.warning("cache.get.failed", key=key)
            return None

    async def _set(self, key: str, value: str, ttl: int) -> None:
        try:
            await self._redis.setex(key, ttl, value)
        except Exception:
            logger.warning("cache.set.failed", key=key)

    async def _delete(self, key: str) -> None:
        try:
            await self._redis.delete(key)
        except Exception:
            logger.warning("cache.delete.failed", key=key)

    async def _delete_pattern(self, pattern: str) -> int:
        deleted = 0
        try:
            cursor_val: int = 0
            while True:
                cursor_val, keys = await self._redis.scan(
                    cursor=cursor_val,
                    match=pattern,
                    count=SCAN_BATCH_SIZE,
                )
                if keys:
                    await self._redis.delete(*keys)
                    deleted += len(keys)
                if cursor_val == 0:
                    break
        except Exception:
            logger.warning("cache.delete_pattern.failed", pattern=pattern)
        return deleted

    @staticmethod
    def _serialize(model: BaseModel) -> str:
        return model.model_dump_json()

    @staticmethod
    def _deserialize(model_class: type[T], data: str) -> T:
        return model_class.model_validate_json(data)
