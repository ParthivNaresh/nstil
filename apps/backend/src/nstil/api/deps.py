from functools import lru_cache
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from nstil.config import Settings
from nstil.core.exceptions import InvalidTokenError, TokenExpiredError
from nstil.core.security import verify_jwt
from nstil.models import UserPayload

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def get_redis(request: Request) -> aioredis.Redis:
    pool: aioredis.Redis = request.app.state.redis
    return pool


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
