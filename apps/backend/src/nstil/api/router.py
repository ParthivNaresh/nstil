from fastapi import APIRouter

from nstil.api.v1 import (
    ai_context,
    ai_profile,
    auth,
    breathing,
    check_in,
    entries,
    health,
    insights,
    journals,
    media,
    profile,
)

api_router = APIRouter(prefix="/api")

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(auth.router)
v1_router.include_router(health.router)
v1_router.include_router(entries.router)
v1_router.include_router(journals.router)
v1_router.include_router(media.router)
v1_router.include_router(breathing.router)
v1_router.include_router(check_in.router)
v1_router.include_router(insights.router)
v1_router.include_router(profile.router)
v1_router.include_router(ai_profile.router)
v1_router.include_router(ai_context.router)

api_router.include_router(v1_router)
