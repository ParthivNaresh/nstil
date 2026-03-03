import time
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from nstil.api.deps import get_current_user, get_token_blacklist
from nstil.models import UserPayload
from nstil.services.token_blacklist import TokenBlacklistService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-out", status_code=status.HTTP_204_NO_CONTENT)
async def sign_out(
    user: Annotated[UserPayload, Depends(get_current_user)],
    blacklist: Annotated[TokenBlacklistService | None, Depends(get_token_blacklist)],
) -> Response:
    if blacklist is not None and user.session_id is not None:
        ttl = user.exp - int(time.time())
        await blacklist.revoke(user.session_id, ttl)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
