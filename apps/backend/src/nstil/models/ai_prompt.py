from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from nstil.models.mood import MoodCategory


class PromptType(StrEnum):
    CHECK_IN = "check_in"
    GUIDED = "guided"
    REFLECTION = "reflection"
    NUDGE = "nudge"
    SUMMARY = "summary"
    AFFIRMATION = "affirmation"
    REFRAME = "reframe"
    FOLLOW_UP = "follow_up"
    GOAL_CHECK = "goal_check"
    NOTIFICATION = "notification"


class PromptSource(StrEnum):
    CURATED = "curated"
    ON_DEVICE_LLM = "on_device_llm"
    CLOUD_LLM = "cloud_llm"


class PromptStatus(StrEnum):
    PENDING = "pending"
    DELIVERED = "delivered"
    SEEN = "seen"
    ENGAGED = "engaged"
    DISMISSED = "dismissed"
    EXPIRED = "expired"
    CONVERTED = "converted"


MAX_PROMPT_CONTENT_LENGTH = 10_000


class AIPromptRow(BaseModel):
    id: UUID
    user_id: UUID
    prompt_type: str
    content: str
    context: dict[str, object]
    source: str
    mood_category: str | None
    session_id: UUID | None
    entry_id: UUID | None
    converted_entry_id: UUID | None
    status: str
    delivered_at: datetime | None
    seen_at: datetime | None
    engaged_at: datetime | None
    dismissed_at: datetime | None
    converted_at: datetime | None
    created_at: datetime
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class AIPromptCreate(BaseModel):
    prompt_type: PromptType = Field(...)
    content: str = Field(..., min_length=1, max_length=MAX_PROMPT_CONTENT_LENGTH)
    source: PromptSource = Field(default=PromptSource.CURATED)
    mood_category: MoodCategory | None = Field(default=None)
    session_id: UUID | None = Field(default=None)
    entry_id: UUID | None = Field(default=None)
    context: dict[str, object] = Field(default_factory=dict)

    @field_validator("content")
    @classmethod
    def strip_content(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            msg = "Content must not be blank"
            raise ValueError(msg)
        return stripped


class AIPromptUpdate(BaseModel):
    status: PromptStatus | None = Field(default=None)
    converted_entry_id: UUID | None = Field(default=None)
    delivered_at: datetime | None = Field(default=None)
    seen_at: datetime | None = Field(default=None)
    engaged_at: datetime | None = Field(default=None)
    dismissed_at: datetime | None = Field(default=None)
    converted_at: datetime | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "AIPromptUpdate":
        has_value = any(getattr(self, field) is not None for field in self.__class__.model_fields)
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    def to_update_dict(self) -> dict[str, object]:
        return {k: v for k, v in self.model_dump(mode="json").items() if v is not None}


class AIPromptResponse(BaseModel):
    id: UUID
    user_id: UUID
    prompt_type: str
    content: str
    context: dict[str, object]
    source: str
    mood_category: str | None
    session_id: UUID | None
    entry_id: UUID | None
    converted_entry_id: UUID | None
    status: str
    delivered_at: datetime | None
    seen_at: datetime | None
    engaged_at: datetime | None
    dismissed_at: datetime | None
    converted_at: datetime | None
    created_at: datetime

    @classmethod
    def from_row(cls, row: AIPromptRow) -> "AIPromptResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            prompt_type=row.prompt_type,
            content=row.content,
            context=row.context,
            source=row.source,
            mood_category=row.mood_category,
            session_id=row.session_id,
            entry_id=row.entry_id,
            converted_entry_id=row.converted_entry_id,
            status=row.status,
            delivered_at=row.delivered_at,
            seen_at=row.seen_at,
            engaged_at=row.engaged_at,
            dismissed_at=row.dismissed_at,
            converted_at=row.converted_at,
            created_at=row.created_at,
        )


class AIPromptListResponse(BaseModel):
    items: list[AIPromptResponse]
    next_cursor: str | None
    has_more: bool
