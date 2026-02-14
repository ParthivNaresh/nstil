from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from nstil.api.deps import get_current_user, get_space_service
from nstil.models import (
    JournalSpaceCreate,
    JournalSpaceListResponse,
    JournalSpaceResponse,
    JournalSpaceUpdate,
    UserPayload,
)
from nstil.services.cached_space import CachedSpaceService

router = APIRouter(prefix="/journals", tags=["journals"])


@router.post(
    "",
    response_model=JournalSpaceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_journal(
    data: JournalSpaceCreate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedSpaceService, Depends(get_space_service)],
) -> JournalSpaceResponse:
    row = await service.create(UUID(user.sub), data)
    return JournalSpaceResponse.from_row(row)


@router.get("", response_model=JournalSpaceListResponse)
async def list_journals(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedSpaceService, Depends(get_space_service)],
) -> JournalSpaceListResponse:
    rows = await service.list_spaces(UUID(user.sub))
    items = [JournalSpaceResponse.from_row(row) for row in rows]
    return JournalSpaceListResponse(items=items)


@router.get("/{journal_id}", response_model=JournalSpaceResponse)
async def get_journal(
    journal_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedSpaceService, Depends(get_space_service)],
) -> JournalSpaceResponse:
    row = await service.get_by_id(UUID(user.sub), journal_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found",
        )
    return JournalSpaceResponse.from_row(row)


@router.patch("/{journal_id}", response_model=JournalSpaceResponse)
async def update_journal(
    journal_id: UUID,
    data: JournalSpaceUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedSpaceService, Depends(get_space_service)],
) -> JournalSpaceResponse:
    row = await service.update(UUID(user.sub), journal_id, data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found",
        )
    return JournalSpaceResponse.from_row(row)


@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal(
    journal_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedSpaceService, Depends(get_space_service)],
) -> None:
    deleted = await service.soft_delete(UUID(user.sub), journal_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found",
        )
