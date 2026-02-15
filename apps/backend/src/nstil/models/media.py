from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class MediaContentType(StrEnum):
    JPEG = "image/jpeg"
    PNG = "image/png"
    HEIC = "image/heic"
    WEBP = "image/webp"


ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(ct.value for ct in MediaContentType)
ALLOWED_EXTENSIONS: dict[str, MediaContentType] = {
    ".jpg": MediaContentType.JPEG,
    ".jpeg": MediaContentType.JPEG,
    ".png": MediaContentType.PNG,
    ".heic": MediaContentType.HEIC,
    ".webp": MediaContentType.WEBP,
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_MEDIA_PER_ENTRY = 10


class EntryMediaRow(BaseModel):
    id: UUID
    entry_id: UUID
    user_id: UUID
    storage_path: str
    file_name: str
    content_type: str
    size_bytes: int
    width: int | None
    height: int | None
    sort_order: int
    created_at: datetime

    model_config = {"extra": "ignore"}


class EntryMediaResponse(BaseModel):
    id: UUID
    entry_id: UUID
    file_name: str
    content_type: str
    size_bytes: int
    width: int | None
    height: int | None
    sort_order: int
    url: str
    created_at: datetime

    @classmethod
    def from_row(cls, row: EntryMediaRow, signed_url: str) -> "EntryMediaResponse":
        return cls(
            id=row.id,
            entry_id=row.entry_id,
            file_name=row.file_name,
            content_type=row.content_type,
            size_bytes=row.size_bytes,
            width=row.width,
            height=row.height,
            sort_order=row.sort_order,
            url=signed_url,
            created_at=row.created_at,
        )


class EntryMediaListResponse(BaseModel):
    items: list[EntryMediaResponse]
    count: int = Field(description="Total number of media items for this entry")


PREVIEW_LIMIT = 3


class MediaPreviewItem(BaseModel):
    id: UUID
    url: str


class MediaPreview(BaseModel):
    items: list[MediaPreviewItem]
    total_count: int
