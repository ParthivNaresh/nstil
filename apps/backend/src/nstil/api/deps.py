from functools import lru_cache
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AsyncClient

from nstil.config import Settings
from nstil.core.exceptions import InvalidTokenError, TokenExpiredError
from nstil.core.security import verify_jwt
from nstil.models import UserPayload
from nstil.services.cache import EntryCacheService
from nstil.services.cached_journal import CachedJournalService
from nstil.services.journal import JournalService

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def get_redis(request: Request) -> aioredis.Redis:
    pool: aioredis.Redis = request.app.state.redis
    return pool


def get_supabase(request: Request) -> AsyncClient:
    client: AsyncClient = request.app.state.supabase
    return client


def get_cache_service(
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> EntryCacheService:
    return EntryCacheService(redis)


def get_journal_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    cache: Annotated[EntryCacheService, Depends(get_cache_service)],
) -> CachedJournalService:
    db_service = JournalService(supabase)
    return CachedJournalService(db_service, cache)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserPayload:
    try:
        return verify_jwt(credentials.credentials, settings)
    except TokenExpiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
