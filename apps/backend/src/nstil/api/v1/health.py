from typing import Annotated

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends

from nstil.api.deps import get_redis

router = APIRouter()


@router.get("/health")
async def health_check(
    redis_pool: Annotated[aioredis.Redis, Depends(get_redis)],
) -> dict[str, str]:
    try:
        await redis_pool.ping()
        redis_status = "ok"
    except Exception:
        redis_status = "unavailable"

    return {"status": "ok", "redis": redis_status}
