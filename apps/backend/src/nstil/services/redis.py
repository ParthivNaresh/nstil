import redis.asyncio as aioredis


async def create_redis_pool(url: str, max_connections: int = 50) -> aioredis.Redis:
    pool: aioredis.Redis = aioredis.from_url(  # type: ignore[no-untyped-call]
        url,
        decode_responses=True,
        max_connections=max_connections,
    )
    return pool


async def close_redis_pool(pool: aioredis.Redis) -> None:
    await pool.aclose()
