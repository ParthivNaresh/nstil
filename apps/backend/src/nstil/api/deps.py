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
from nstil.services.ai.check_in import CheckInOrchestrator
from nstil.services.ai.context import AIContextService
from nstil.services.ai.insight import AIInsightService
from nstil.services.ai.insight_engine import InsightEngine
from nstil.services.ai.profile import AIProfileService
from nstil.services.ai.prompt import AIPromptService
from nstil.services.ai.prompt_engine import PromptEngine
from nstil.services.ai.session import AISessionService
from nstil.services.cache import EntryCacheService, SpaceCacheService
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.cached_ai_context import CachedAIContextService
from nstil.services.cached_ai_profile import CachedAIProfileService
from nstil.services.cached_journal import CachedJournalService
from nstil.services.cached_notification import CachedNotificationService
from nstil.services.cached_profile import CachedProfileService
from nstil.services.cached_space import CachedSpaceService
from nstil.services.journal import JournalService
from nstil.services.media import MediaService
from nstil.services.notification import NotificationService
from nstil.services.profile import ProfileService
from nstil.services.space import JournalSpaceService

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


def get_space_cache_service(
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> SpaceCacheService:
    return SpaceCacheService(redis)


def get_journal_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    cache: Annotated[EntryCacheService, Depends(get_cache_service)],
) -> CachedJournalService:
    db_service = JournalService(supabase)
    return CachedJournalService(db_service, cache)


def get_space_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    space_cache: Annotated[SpaceCacheService, Depends(get_space_cache_service)],
    entry_cache: Annotated[EntryCacheService, Depends(get_cache_service)],
) -> CachedSpaceService:
    db_service = JournalSpaceService(supabase)
    return CachedSpaceService(db_service, space_cache, entry_cache)


def get_media_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> MediaService:
    return MediaService(supabase)


def get_ai_cache_service(
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> AICacheService:
    return AICacheService(redis)


def get_ai_context_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    ai_cache: Annotated[AICacheService, Depends(get_ai_cache_service)],
) -> CachedAIContextService:
    return CachedAIContextService(AIContextService(supabase), ai_cache)


def get_ai_profile_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    ai_cache: Annotated[AICacheService, Depends(get_ai_cache_service)],
) -> CachedAIProfileService:
    return CachedAIProfileService(AIProfileService(supabase), ai_cache)


def get_notification_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    ai_cache: Annotated[AICacheService, Depends(get_ai_cache_service)],
) -> CachedNotificationService:
    return CachedNotificationService(NotificationService(supabase), ai_cache)


def get_profile_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
    ai_cache: Annotated[AICacheService, Depends(get_ai_cache_service)],
) -> CachedProfileService:
    return CachedProfileService(ProfileService(supabase), ai_cache)


def get_ai_session_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> AISessionService:
    return AISessionService(supabase)


def get_ai_prompt_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> AIPromptService:
    return AIPromptService(supabase)


def get_ai_insight_service(
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> AIInsightService:
    return AIInsightService(supabase)


def get_prompt_engine(
    context_service: Annotated[CachedAIContextService, Depends(get_ai_context_service)],
    prompt_service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
) -> PromptEngine:
    return PromptEngine(context_service, prompt_service)


def get_check_in_orchestrator(
    session_service: Annotated[AISessionService, Depends(get_ai_session_service)],
    prompt_engine: Annotated[PromptEngine, Depends(get_prompt_engine)],
    prompt_service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
    journal_service: Annotated[CachedJournalService, Depends(get_journal_service)],
    space_service: Annotated[CachedSpaceService, Depends(get_space_service)],
    profile_service: Annotated[CachedAIProfileService, Depends(get_ai_profile_service)],
    context_service: Annotated[CachedAIContextService, Depends(get_ai_context_service)],
) -> CheckInOrchestrator:
    return CheckInOrchestrator(
        session_service=session_service,
        prompt_engine=prompt_engine,
        prompt_service=prompt_service,
        journal_service=journal_service,
        space_service=space_service,
        profile_service=profile_service,
        context_service=context_service,
    )


def get_insight_engine(
    insight_service: Annotated[AIInsightService, Depends(get_ai_insight_service)],
    context_service: Annotated[CachedAIContextService, Depends(get_ai_context_service)],
    journal_service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> InsightEngine:
    return InsightEngine(insight_service, context_service, journal_service)


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
