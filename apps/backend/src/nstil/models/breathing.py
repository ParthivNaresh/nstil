from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from nstil.models.mood import MoodCategory

MAX_DURATION_SECONDS = 600


class BreathingPattern(StrEnum):
    BOX = "box"
    FOUR_SEVEN_EIGHT = "478"
    CALM = "calm"


class BreathingSessionRow(BaseModel):
    id: UUID
    user_id: UUID
    pattern: str
    duration_seconds: int
    cycles_completed: int
    cycles_target: int
    mood_before: str | None
    mood_after: str | None
    completed: bool
    created_at: datetime

    model_config = {"extra": "ignore"}


class BreathingSessionCreate(BaseModel):
    pattern: BreathingPattern = Field(...)
    duration_seconds: int = Field(..., gt=0, le=MAX_DURATION_SECONDS)
    cycles_target: int = Field(..., gt=0)
    mood_before: MoodCategory | None = Field(default=None)


class BreathingSessionUpdate(BaseModel):
    cycles_completed: int | None = Field(default=None, ge=0)
    mood_after: MoodCategory | None = Field(default=None)
    completed: bool | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "BreathingSessionUpdate":
        has_value = any(getattr(self, field) is not None for field in self.__class__.model_fields)
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    def to_update_dict(self) -> dict[str, object]:
        return {k: v for k, v in self.model_dump(mode="json").items() if v is not None}


class BreathingSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    pattern: str
    duration_seconds: int
    cycles_completed: int
    cycles_target: int
    mood_before: str | None
    mood_after: str | None
    completed: bool
    created_at: datetime

    @classmethod
    def from_row(cls, row: BreathingSessionRow) -> "BreathingSessionResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            pattern=row.pattern,
            duration_seconds=row.duration_seconds,
            cycles_completed=row.cycles_completed,
            cycles_target=row.cycles_target,
            mood_before=row.mood_before,
            mood_after=row.mood_after,
            completed=row.completed,
            created_at=row.created_at,
        )


class BreathingSessionListResponse(BaseModel):
    items: list[BreathingSessionResponse]
    next_cursor: str | None
    has_more: bool


class BreathingStatsResponse(BaseModel):
    total_sessions: int
    completed_sessions: int
    total_minutes: int
    sessions_this_week: int
