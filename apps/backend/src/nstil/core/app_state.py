from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

import redis.asyncio as aioredis
from supabase import AsyncClient

if TYPE_CHECKING:
    from nstil.services.rate_limit import RateLimitService


@dataclass(slots=True)
class AppState:
    redis: aioredis.Redis
    supabase: AsyncClient
    rate_limiter: RateLimitService | None = None
