from datetime import date, datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class InsightType(StrEnum):
    PATTERN = "pattern"
    TREND = "trend"
    CONNECTION = "connection"
    GOAL_PROGRESS = "goal_progress"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"
    YEARLY_SUMMARY = "yearly_summary"
    COGNITIVE_PATTERN = "cognitive_pattern"
    STREAK_MILESTONE = "streak_milestone"
    CORRELATION = "correlation"
    ANOMALY = "anomaly"
    RECOMMENDATION = "recommendation"


class InsightSource(StrEnum):
    ON_DEVICE_LLM = "on_device_llm"
    CLOUD_LLM = "cloud_llm"
    COMPUTED = "computed"


class InsightStatus(StrEnum):
    GENERATED = "generated"
    DELIVERED = "delivered"
    SEEN = "seen"
    DISMISSED = "dismissed"
    BOOKMARKED = "bookmarked"


MAX_INSIGHT_TITLE_LENGTH = 500
MAX_INSIGHT_CONTENT_LENGTH = 50_000


class AIInsightRow(BaseModel):
    id: UUID
    user_id: UUID
    insight_type: str
    title: str
    content: str
    supporting_entry_ids: list[UUID]
    source: str
    model_id: str | None
    confidence: float | None
    period_start: date | None
    period_end: date | None
    status: str
    session_id: UUID | None
    superseded_by: UUID | None
    metadata: dict[str, object]
    created_at: datetime
    expires_at: datetime | None
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class AIInsightCreate(BaseModel):
    insight_type: InsightType = Field(...)
    title: str = Field(..., min_length=1, max_length=MAX_INSIGHT_TITLE_LENGTH)
    content: str = Field(..., min_length=1, max_length=MAX_INSIGHT_CONTENT_LENGTH)
    supporting_entry_ids: list[UUID] = Field(default_factory=list)
    source: InsightSource = Field(default=InsightSource.COMPUTED)
    model_id: str | None = Field(default=None, max_length=100)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    period_start: date | None = Field(default=None)
    period_end: date | None = Field(default=None)
    session_id: UUID | None = Field(default=None)
    metadata: dict[str, object] = Field(default_factory=dict)
    expires_at: datetime | None = Field(default=None)

    @model_validator(mode="after")
    def validate_period_order(self) -> "AIInsightCreate":
        if (
            self.period_start is not None
            and self.period_end is not None
            and self.period_start > self.period_end
        ):
            msg = "period_start must be before or equal to period_end"
            raise ValueError(msg)
        return self

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            msg = "Title must not be blank"
            raise ValueError(msg)
        return stripped

    @field_validator("content")
    @classmethod
    def strip_content(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            msg = "Content must not be blank"
            raise ValueError(msg)
        return stripped


class AIInsightUpdate(BaseModel):
    status: InsightStatus | None = Field(default=None)
    superseded_by: UUID | None = Field(default=None)
    metadata: dict[str, object] | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "AIInsightUpdate":
        has_value = any(getattr(self, field) is not None for field in self.__class__.model_fields)
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    def to_update_dict(self) -> dict[str, object]:
        return {k: v for k, v in self.model_dump(mode="json").items() if v is not None}


class AIInsightResponse(BaseModel):
    id: UUID
    user_id: UUID
    insight_type: str
    title: str
    content: str
    supporting_entry_ids: list[UUID]
    source: str
    model_id: str | None
    confidence: float | None
    period_start: date | None
    period_end: date | None
    status: str
    session_id: UUID | None
    superseded_by: UUID | None
    metadata: dict[str, object]
    created_at: datetime
    expires_at: datetime | None

    @classmethod
    def from_row(cls, row: AIInsightRow) -> "AIInsightResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            insight_type=row.insight_type,
            title=row.title,
            content=row.content,
            supporting_entry_ids=row.supporting_entry_ids,
            source=row.source,
            model_id=row.model_id,
            confidence=row.confidence,
            period_start=row.period_start,
            period_end=row.period_end,
            status=row.status,
            session_id=row.session_id,
            superseded_by=row.superseded_by,
            metadata=row.metadata,
            created_at=row.created_at,
            expires_at=row.expires_at,
        )


class AIInsightListResponse(BaseModel):
    items: list[AIInsightResponse]
    next_cursor: str | None
    has_more: bool
