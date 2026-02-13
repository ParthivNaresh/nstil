from fastapi import APIRouter

from nstil.api.v1 import health

api_router = APIRouter(prefix="/api")

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health.router)

api_router.include_router(v1_router)
