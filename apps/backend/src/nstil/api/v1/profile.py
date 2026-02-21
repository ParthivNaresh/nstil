from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from nstil.api.deps import get_current_user, get_profile_service
from nstil.models import UserPayload
from nstil.models.profile import ProfileResponse, ProfileUpdate
from nstil.services.cached_profile import CachedProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    row = await service.get(UUID(user.sub))
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return ProfileResponse.from_row(row)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    row = await service.update(UUID(user.sub), data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return ProfileResponse.from_row(row)


@router.post("/onboarding-complete", response_model=ProfileResponse)
async def complete_onboarding(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    row = await service.complete_onboarding(UUID(user.sub))
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return ProfileResponse.from_row(row)
