from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from nstil.api.deps import get_breathing_service, get_current_user
from nstil.models import UserPayload
from nstil.models.breathing import (
    BreathingSessionCreate,
    BreathingSessionListResponse,
    BreathingSessionResponse,
    BreathingSessionUpdate,
    BreathingStatsResponse,
)
from nstil.models.pagination import CursorParams
from nstil.services.breathing import BreathingService

router = APIRouter(prefix="/breathing", tags=["breathing"])


@router.post(
    "/sessions",
    response_model=BreathingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    data: BreathingSessionCreate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[BreathingService, Depends(get_breathing_service)],
) -> BreathingSessionResponse:
    row = await service.create(UUID(user.sub), data)
    return BreathingSessionResponse.from_row(row)


@router.patch(
    "/sessions/{session_id}",
    response_model=BreathingSessionResponse,
)
async def update_session(
    session_id: UUID,
    data: BreathingSessionUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[BreathingService, Depends(get_breathing_service)],
) -> BreathingSessionResponse:
    row = await service.complete(UUID(user.sub), session_id, data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Breathing session not found",
        )
    return BreathingSessionResponse.from_row(row)


@router.get("/stats", response_model=BreathingStatsResponse)
async def get_stats(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[BreathingService, Depends(get_breathing_service)],
) -> BreathingStatsResponse:
    return await service.get_stats(UUID(user.sub))


@router.get("/sessions", response_model=BreathingSessionListResponse)
async def list_sessions(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[BreathingService, Depends(get_breathing_service)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> BreathingSessionListResponse:
    params = CursorParams(cursor=cursor, limit=limit)
    rows, has_more = await service.list_recent(UUID(user.sub), params)

    items = [BreathingSessionResponse.from_row(row) for row in rows]
    next_cursor = rows[-1].created_at.isoformat() if has_more and rows else None

    return BreathingSessionListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )
