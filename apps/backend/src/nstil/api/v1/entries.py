from datetime import UTC, date, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from nstil.api.deps import get_current_user, get_journal_service, get_media_service
from nstil.models import (
    CalendarParams,
    CalendarResponse,
    CursorParams,
    JournalEntryCreate,
    JournalEntryListResponse,
    JournalEntryResponse,
    JournalEntryUpdate,
    SearchParams,
    UserPayload,
)
from nstil.models.calendar import compute_streak
from nstil.models.journal import JournalEntryRow
from nstil.models.media import MediaPreview
from nstil.services.cached_journal import CachedJournalService
from nstil.services.media import MediaService

router = APIRouter(prefix="/entries", tags=["entries"])


async def _build_responses_with_previews(
    rows: list[JournalEntryRow],
    user_id: UUID,
    media_service: MediaService,
) -> list[JournalEntryResponse]:
    entry_ids = [row.id for row in rows]
    previews: dict[UUID, MediaPreview] = await media_service.get_previews_for_entries(
        entry_ids, user_id
    )
    return [
        JournalEntryResponse.from_row(row, previews.get(row.id))
        for row in rows
    ]


@router.post(
    "",
    response_model=JournalEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_entry(
    data: JournalEntryCreate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> JournalEntryResponse:
    row = await service.create(UUID(user.sub), data)
    return JournalEntryResponse.from_row(row)


@router.get("", response_model=JournalEntryListResponse)
async def list_entries(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    journal_id: Annotated[UUID | None, Query()] = None,
    entry_date: Annotated[date | None, Query(alias="date")] = None,
    timezone: Annotated[str, Query(max_length=50)] = "UTC",
) -> JournalEntryListResponse:
    user_id = UUID(user.sub)
    params = CursorParams(cursor=cursor, limit=limit)
    rows, has_more = await service.list_entries(
        user_id, params, journal_id=journal_id,
        entry_date=entry_date, timezone=timezone,
    )
    items = await _build_responses_with_previews(rows, user_id, media_service)
    next_cursor = rows[-1].created_at.isoformat() if has_more and rows else None
    return JournalEntryListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
    year: Annotated[int, Query(ge=2020, le=2100)],
    month: Annotated[int, Query(ge=1, le=12)],
    timezone: Annotated[str, Query(max_length=50)] = "UTC",
) -> CalendarResponse:
    params = CalendarParams(year=year, month=month, timezone=timezone)
    days = await service.get_calendar(UUID(user.sub), params)
    total = sum(d.entry_count for d in days)
    today = datetime.now(UTC).date()
    streak = compute_streak(days, today)
    return CalendarResponse(
        year=year,
        month=month,
        days=days,
        total_entries=total,
        streak=streak,
    )


@router.get("/search", response_model=JournalEntryListResponse)
async def search_entries(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
    q: Annotated[str, Query(min_length=1, max_length=200)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    journal_id: Annotated[UUID | None, Query()] = None,
) -> JournalEntryListResponse:
    stripped = q.strip()
    if not stripped:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Search query must not be blank",
        )
    user_id = UUID(user.sub)
    params = SearchParams(query=stripped, cursor=cursor, limit=limit)
    rows, has_more = await service.search(
        user_id, params, journal_id=journal_id
    )
    items = await _build_responses_with_previews(rows, user_id, media_service)
    next_cursor = rows[-1].created_at.isoformat() if has_more and rows else None
    return JournalEntryListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_entry(
    entry_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> JournalEntryResponse:
    row = await service.get_by_id(UUID(user.sub), entry_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    return JournalEntryResponse.from_row(row)


@router.patch("/{entry_id}", response_model=JournalEntryResponse)
async def update_entry(
    entry_id: UUID,
    data: JournalEntryUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> JournalEntryResponse:
    row = await service.update(UUID(user.sub), entry_id, data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    return JournalEntryResponse.from_row(row)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> None:
    deleted = await service.soft_delete(UUID(user.sub), entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
