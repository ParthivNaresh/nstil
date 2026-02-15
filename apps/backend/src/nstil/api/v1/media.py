from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from nstil.api.deps import get_current_user, get_journal_service, get_media_service
from nstil.models import UserPayload
from nstil.models.media import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    EntryMediaListResponse,
    EntryMediaResponse,
)
from nstil.services.cached_journal import CachedJournalService
from nstil.services.media import (
    FileTooLargeError,
    InvalidMediaTypeError,
    MediaLimitExceededError,
    MediaService,
)

router = APIRouter(prefix="/entries/{entry_id}/media", tags=["media"])


async def _verify_entry_ownership(
    entry_id: UUID,
    user_id: UUID,
    journal_service: CachedJournalService,
) -> None:
    entry = await journal_service.get_by_id(user_id, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )


@router.post(
    "",
    response_model=EntryMediaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_media(
    entry_id: UUID,
    file: UploadFile,
    user: Annotated[UserPayload, Depends(get_current_user)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
    journal_service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> EntryMediaResponse:
    user_id = UUID(user.sub)
    await _verify_entry_ownership(entry_id, user_id, journal_service)

    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"File type '{content_type}' is not supported. "
            f"Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
        )

    file_name = file.filename or "untitled"

    try:
        row = await media_service.upload(
            user_id=user_id,
            entry_id=entry_id,
            file_bytes=file_bytes,
            file_name=file_name,
            content_type=content_type,
        )
    except MediaLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except InvalidMediaTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except FileTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(exc),
        ) from exc

    signed_url = await media_service.create_signed_url(row.storage_path)
    return EntryMediaResponse.from_row(row, signed_url)


@router.get("", response_model=EntryMediaListResponse)
async def list_media(
    entry_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
    journal_service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> EntryMediaListResponse:
    user_id = UUID(user.sub)
    await _verify_entry_ownership(entry_id, user_id, journal_service)

    rows = await media_service.list_media(entry_id, user_id)

    if not rows:
        return EntryMediaListResponse(items=[], count=0)

    paths = [row.storage_path for row in rows]
    signed_urls = await media_service.create_signed_urls(paths)

    items = [
        EntryMediaResponse.from_row(row, url)
        for row, url in zip(rows, signed_urls, strict=True)
    ]
    return EntryMediaListResponse(items=items, count=len(items))


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    entry_id: UUID,
    media_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
    journal_service: Annotated[CachedJournalService, Depends(get_journal_service)],
) -> None:
    user_id = UUID(user.sub)
    await _verify_entry_ownership(entry_id, user_id, journal_service)

    deleted = await media_service.delete(media_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
