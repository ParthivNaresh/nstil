from dataclasses import dataclass

import redis.asyncio as aioredis
from supabase import AsyncClient


@dataclass(slots=True)
class AppState:
    redis: aioredis.Redis
    supabase: AsyncClient
