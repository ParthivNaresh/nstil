from fastapi import APIRouter

from nstil.api.v1 import entries, health

api_router = APIRouter(prefix="/api")

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health.router)
v1_router.include_router(entries.router)

api_router.include_router(v1_router)
