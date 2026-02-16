from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class MediaContentType(StrEnum):
    JPEG = "image/jpeg"
    PNG = "image/png"
    HEIC = "image/heic"
    WEBP = "image/webp"
    M4A = "audio/m4a"
    MP4_AUDIO = "audio/mp4"
    AAC = "audio/aac"
    WAV = "audio/wav"
    MPEG = "audio/mpeg"
    X_M4A = "audio/x-m4a"


ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(ct.value for ct in MediaContentType)

IMAGE_CONTENT_TYPES: frozenset[str] = frozenset({
    MediaContentType.JPEG,
    MediaContentType.PNG,
    MediaContentType.HEIC,
    MediaContentType.WEBP,
})

AUDIO_CONTENT_TYPES: frozenset[str] = frozenset({
    MediaContentType.M4A,
    MediaContentType.MP4_AUDIO,
    MediaContentType.AAC,
    MediaContentType.WAV,
    MediaContentType.MPEG,
    MediaContentType.X_M4A,
})

ALLOWED_EXTENSIONS: dict[str, MediaContentType] = {
    ".jpg": MediaContentType.JPEG,
    ".jpeg": MediaContentType.JPEG,
    ".png": MediaContentType.PNG,
    ".heic": MediaContentType.HEIC,
    ".webp": MediaContentType.WEBP,
    ".m4a": MediaContentType.M4A,
    ".aac": MediaContentType.AAC,
    ".wav": MediaContentType.WAV,
    ".mp3": MediaContentType.MPEG,
    ".mp4": MediaContentType.MP4_AUDIO,
}

MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_AUDIO_FILE_SIZE_BYTES = 25 * 1024 * 1024
MAX_IMAGES_PER_ENTRY = 10
MAX_AUDIO_PER_ENTRY = 1
MAX_AUDIO_DURATION_MS = 5 * 60 * 1000


def is_audio_content_type(content_type: str) -> bool:
    return content_type in AUDIO_CONTENT_TYPES


def max_file_size_for_content_type(content_type: str) -> int:
    if is_audio_content_type(content_type):
        return MAX_AUDIO_FILE_SIZE_BYTES
    return MAX_IMAGE_FILE_SIZE_BYTES


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
    duration_ms: int | None
    waveform: list[float] | None = None
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
    duration_ms: int | None
    waveform: list[float] | None = None
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
            duration_ms=row.duration_ms,
            waveform=row.waveform,
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
