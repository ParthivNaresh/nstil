from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from nstil.api.deps import (
    get_ai_profile_service,
    get_current_user,
    get_notification_service,
)
from nstil.models import (
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    UserAIProfileResponse,
    UserAIProfileUpdate,
    UserPayload,
)
from nstil.services.cached_ai_profile import CachedAIProfileService
from nstil.services.cached_notification import CachedNotificationService

router = APIRouter(prefix="/ai", tags=["ai-profile"])


@router.get("/profile", response_model=UserAIProfileResponse)
async def get_ai_profile(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedAIProfileService, Depends(get_ai_profile_service)],
) -> UserAIProfileResponse:
    row = await service.get_or_create(UUID(user.sub))
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI profile not found",
        )
    return UserAIProfileResponse.from_row(row)


@router.patch("/profile", response_model=UserAIProfileResponse)
async def update_ai_profile(
    data: UserAIProfileUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedAIProfileService, Depends(get_ai_profile_service)],
) -> UserAIProfileResponse:
    row = await service.update(UUID(user.sub), data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI profile not found",
        )
    return UserAIProfileResponse.from_row(row)


@router.get("/notifications", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedNotificationService, Depends(get_notification_service)],
) -> NotificationPreferencesResponse:
    row = await service.get_or_create(UUID(user.sub))
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification preferences not found",
        )
    return NotificationPreferencesResponse.from_row(row)


@router.patch("/notifications", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedNotificationService, Depends(get_notification_service)],
) -> NotificationPreferencesResponse:
    row = await service.update(UUID(user.sub), data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification preferences not found",
        )
    return NotificationPreferencesResponse.from_row(row)
