from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class FeedbackTargetType(StrEnum):
    MESSAGE = "message"
    PROMPT = "prompt"
    INSIGHT = "insight"
    SESSION = "session"


MAX_FEEDBACK_REASON_LENGTH = 1000


class AIFeedbackRow(BaseModel):
    id: UUID
    user_id: UUID
    target_type: str
    target_id: UUID
    rating: int
    reason: str | None
    metadata: dict[str, object]
    created_at: datetime

    model_config = {"extra": "ignore"}


class AIFeedbackCreate(BaseModel):
    target_type: FeedbackTargetType = Field(...)
    target_id: UUID = Field(...)
    rating: int = Field(..., ge=-1, le=1)
    reason: str | None = Field(default=None, max_length=MAX_FEEDBACK_REASON_LENGTH)
    metadata: dict[str, object] = Field(default_factory=dict)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        return stripped or None


class AIFeedbackResponse(BaseModel):
    id: UUID
    target_type: str
    target_id: UUID
    rating: int
    reason: str | None
    metadata: dict[str, object]
    created_at: datetime

    @classmethod
    def from_row(cls, row: AIFeedbackRow) -> "AIFeedbackResponse":
        return cls(
            id=row.id,
            target_type=row.target_type,
            target_id=row.target_id,
            rating=row.rating,
            reason=row.reason,
            metadata=row.metadata,
            created_at=row.created_at,
        )


class AIFeedbackListResponse(BaseModel):
    items: list[AIFeedbackResponse]
    next_cursor: str | None
    has_more: bool
