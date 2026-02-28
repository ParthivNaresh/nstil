from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nstil.api.deps import get_settings
from nstil.api.middleware import CacheControlMiddleware
from nstil.api.rate_limit_middleware import RateLimitMiddleware
from nstil.api.router import api_router
from nstil.core.app_state import AppState
from nstil.core.jwks import jwks_store
from nstil.observability import RequestLoggingMiddleware, configure_logging, get_logger
from nstil.services.rate_limit import RateLimitService
from nstil.services.redis import close_redis_pool, create_redis_pool
from nstil.services.supabase import create_supabase_client
from nstil.services.token_blacklist import TokenBlacklistService

logger = get_logger("nstil.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    redis = await create_redis_pool(settings.redis_url, settings.redis_max_connections)
    supabase = await create_supabase_client(
        settings.supabase_url,
        settings.supabase_service_key.get_secret_value(),
    )
    rate_limiter = RateLimitService(redis) if settings.rate_limit_enabled else None
    token_blacklist = TokenBlacklistService(redis)
    app.state.app = AppState(
        redis=redis,
        supabase=supabase,
        rate_limiter=rate_limiter,
        token_blacklist=token_blacklist,
    )
    try:
        await jwks_store.load(settings.supabase_url)
    except Exception:
        logger.warning("jwks.load_failed", supabase_url=settings.supabase_url)
    logger.info("app.startup", redis_url=settings.redis_url)
    yield
    await close_redis_pool(app.state.app.redis)
    logger.info("app.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    configure_logging(
        log_level=settings.log_level,
        log_format=settings.log_format,
    )

    application = FastAPI(
        title="NStil API",
        debug=settings.debug,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(CacheControlMiddleware)
    application.add_middleware(RateLimitMiddleware, enabled=settings.rate_limit_enabled)
    application.add_middleware(RequestLoggingMiddleware)
    application.include_router(api_router)

    logger.info("app.created", debug=settings.debug)

    return application
