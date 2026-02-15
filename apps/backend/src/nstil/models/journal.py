from datetime import UTC, datetime, timedelta
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from nstil.models.mood import MoodCategory, MoodSpecific, validate_mood_pair


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
FUTURE_TOLERANCE = timedelta(minutes=1)


def _validate_not_future(v: datetime | None) -> datetime | None:
    if v is None:
        return None
    if v.tzinfo is None:
        v = v.replace(tzinfo=UTC)
    if v > datetime.now(UTC) + FUTURE_TOLERANCE:
        msg = "Date cannot be in the future"
        raise ValueError(msg)
    return v


class JournalEntryCreate(BaseModel):
    journal_id: UUID = Field(...)
    title: str = Field(default="", max_length=MAX_TITLE_LENGTH)
    body: str = Field(..., min_length=1, max_length=MAX_BODY_LENGTH)
    mood_category: MoodCategory | None = Field(default=None)
    mood_specific: MoodSpecific | None = Field(default=None)
    tags: list[str] = Field(default_factory=list)
    location: str | None = Field(default=None, max_length=MAX_LOCATION_LENGTH)
    entry_type: EntryType = Field(default=EntryType.JOURNAL)
    is_pinned: bool = Field(default=False)
    created_at: datetime | None = Field(default=None)

    @model_validator(mode="after")
    def validate_mood(self) -> "JournalEntryCreate":
        validate_mood_pair(self.mood_category, self.mood_specific)
        return self

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, v: datetime | None) -> datetime | None:
        return _validate_not_future(v)

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
    journal_id: UUID | None = Field(default=None)
    title: str | None = Field(default=None, max_length=MAX_TITLE_LENGTH)
    body: str | None = Field(default=None, min_length=1, max_length=MAX_BODY_LENGTH)
    mood_category: MoodCategory | None = Field(default=None)
    mood_specific: MoodSpecific | None = Field(default=None)
    tags: list[str] | None = Field(default=None)
    location: str | None = Field(default=None, max_length=MAX_LOCATION_LENGTH)
    entry_type: EntryType | None = Field(default=None)
    is_pinned: bool | None = Field(default=None)
    created_at: datetime | None = Field(default=None)

    @model_validator(mode="after")
    def validate_mood_and_fields(self) -> "JournalEntryUpdate":
        has_value = any(
            getattr(self, field) is not None
            for field in self.__class__.model_fields
        )
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        if self.mood_specific is not None and self.mood_category is None:
            msg = "mood_specific requires mood_category"
            raise ValueError(msg)
        if self.mood_specific is not None and self.mood_category is not None:
            validate_mood_pair(self.mood_category, self.mood_specific)
        return self

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, v: datetime | None) -> datetime | None:
        return _validate_not_future(v)

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

    def to_update_dict(self) -> dict[str, str | int | bool | list[str]]:
        return {
            k: v
            for k, v in self.model_dump(mode="json").items()
            if v is not None
        }


class JournalEntryRow(BaseModel):
    id: UUID
    user_id: UUID
    journal_id: UUID
    title: str
    body: str
    mood_category: str | None
    mood_specific: str | None
    tags: list[str]
    location: str | None
    entry_type: str
    is_pinned: bool
    metadata: dict[str, object]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class JournalEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    journal_id: UUID
    title: str
    body: str
    mood_category: str | None
    mood_specific: str | None
    tags: list[str]
    location: str | None
    entry_type: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: JournalEntryRow) -> "JournalEntryResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            journal_id=row.journal_id,
            title=row.title,
            body=row.body,
            mood_category=row.mood_category,
            mood_specific=row.mood_specific,
            tags=row.tags,
            location=row.location,
            entry_type=row.entry_type,
            is_pinned=row.is_pinned,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


class JournalEntryListResponse(BaseModel):
    items: list[JournalEntryResponse]
    next_cursor: str | None
    has_more: bool
