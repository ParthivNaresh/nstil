from fastapi import APIRouter

from nstil.api.v1 import entries, health, journals

api_router = APIRouter(prefix="/api")

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health.router)
v1_router.include_router(entries.router)
v1_router.include_router(journals.router)

api_router.include_router(v1_router)
