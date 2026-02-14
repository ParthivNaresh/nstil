from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class EntryType(StrEnum):
    JOURNAL = "journal"
    REFLECTION = "reflection"
    GRATITUDE = "gratitude"
    FREEWRITE = "freewrite"


MAX_TITLE_LENGTH = 200
MAX_BODY_LENGTH = 50_000
MAX_TAG_LENGTH = 50
MAX_TAG_COUNT = 10
MAX_LOCATION_LENGTH = 200
MIN_MOOD = 1
MAX_MOOD = 5


class JournalEntryCreate(BaseModel):
    title: str = Field(default="", max_length=MAX_TITLE_LENGTH)
    body: str = Field(..., min_length=1, max_length=MAX_BODY_LENGTH)
    mood_score: int | None = Field(default=None, ge=MIN_MOOD, le=MAX_MOOD)
    tags: list[str] = Field(default_factory=list)
    location: str | None = Field(default=None, max_length=MAX_LOCATION_LENGTH)
    entry_type: EntryType = Field(default=EntryType.JOURNAL)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        if len(v) > MAX_TAG_COUNT:
            msg = f"Maximum {MAX_TAG_COUNT} tags allowed"
            raise ValueError(msg)
        cleaned: list[str] = []
        for tag in v:
            stripped = tag.strip()
            if not stripped:
                continue
            if len(stripped) > MAX_TAG_LENGTH:
                msg = f"Tag must be at most {MAX_TAG_LENGTH} characters"
                raise ValueError(msg)
            cleaned.append(stripped)
        return cleaned

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()

    @field_validator("body", mode="before")
    @classmethod
    def strip_body(cls, v: str) -> str:
        return v.strip()


class JournalEntryUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=MAX_TITLE_LENGTH)
    body: str | None = Field(default=None, min_length=1, max_length=MAX_BODY_LENGTH)
    mood_score: int | None = Field(default=None, ge=MIN_MOOD, le=MAX_MOOD)
    tags: list[str] | None = Field(default=None)
    location: str | None = Field(default=None, max_length=MAX_LOCATION_LENGTH)
    entry_type: EntryType | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "JournalEntryUpdate":
        has_value = any(
            getattr(self, field) is not None
            for field in self.__class__.model_fields
        )
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        if len(v) > MAX_TAG_COUNT:
            msg = f"Maximum {MAX_TAG_COUNT} tags allowed"
            raise ValueError(msg)
        cleaned: list[str] = []
        for tag in v:
            stripped = tag.strip()
            if not stripped:
                continue
            if len(stripped) > MAX_TAG_LENGTH:
                msg = f"Tag must be at most {MAX_TAG_LENGTH} characters"
                raise ValueError(msg)
            cleaned.append(stripped)
        return cleaned

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip()

    @field_validator("body", mode="before")
    @classmethod
    def strip_body(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip()

    def to_update_dict(self) -> dict[str, str | int | list[str]]:
        return {
            k: v
            for k, v in self.model_dump().items()
            if v is not None
        }


class JournalEntryRow(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    body: str
    mood_score: int | None
    tags: list[str]
    location: str | None
    entry_type: str
    metadata: dict[str, object]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class JournalEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    body: str
    mood_score: int | None
    tags: list[str]
    location: str | None
    entry_type: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: JournalEntryRow) -> "JournalEntryResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            title=row.title,
            body=row.body,
            mood_score=row.mood_score,
            tags=row.tags,
            location=row.location,
            entry_type=row.entry_type,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


class JournalEntryListResponse(BaseModel):
    items: list[JournalEntryResponse]
    next_cursor: str | None
    has_more: bool
