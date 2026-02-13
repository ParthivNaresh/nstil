from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nstil.api.deps import get_settings
from nstil.api.middleware import CacheControlMiddleware
from nstil.api.router import api_router
from nstil.observability import RequestLoggingMiddleware, configure_logging, get_logger
from nstil.services.redis import close_redis_pool, create_redis_pool

logger = get_logger("nstil.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.redis = await create_redis_pool(settings.redis_url)
    logger.info("app.startup", redis_url=settings.redis_url)
    yield
    await close_redis_pool(app.state.redis)
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
    application.add_middleware(RequestLoggingMiddleware)
    application.add_middleware(CacheControlMiddleware)
    application.include_router(api_router)

    logger.info("app.created", debug=settings.debug)

    return application


app = create_app()
