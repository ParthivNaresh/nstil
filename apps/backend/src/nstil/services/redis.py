from typing import Any

import redis.asyncio as aioredis


async def create_redis_pool(url: str) -> Any:
    return aioredis.from_url(url, decode_responses=True)  # type: ignore[no-untyped-call]


async def close_redis_pool(pool: aioredis.Redis) -> None:
    await pool.aclose()
