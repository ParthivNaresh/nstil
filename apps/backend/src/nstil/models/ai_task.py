from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class TaskType(StrEnum):
    GENERATE_EMBEDDINGS = "generate_embeddings"
    GENERATE_INSIGHT = "generate_insight"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"
    YEARLY_SUMMARY = "yearly_summary"
    PATTERN_DETECTION = "pattern_detection"
    REEMBED_ENTRIES = "reembed_entries"
    GOAL_EVALUATION = "goal_evaluation"
    ANOMALY_DETECTION = "anomaly_detection"


class TaskStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


MAX_TASK_PRIORITY = 10


class AIAgentTaskRow(BaseModel):
    id: UUID
    user_id: UUID
    task_type: str
    status: str
    priority: int
    input: dict[str, object]
    output: dict[str, object] | None
    error: str | None
    session_id: UUID | None
    attempts: int
    max_attempts: int
    scheduled_for: datetime
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"extra": "ignore"}


class AIAgentTaskCreate(BaseModel):
    user_id: UUID = Field(...)
    task_type: TaskType = Field(...)
    priority: int = Field(default=0, ge=0, le=MAX_TASK_PRIORITY)
    input: dict[str, object] = Field(default_factory=dict)
    session_id: UUID | None = Field(default=None)
    max_attempts: int = Field(default=3, ge=1, le=10)
    scheduled_for: datetime | None = Field(default=None)


class AIAgentTaskUpdate(BaseModel):
    status: TaskStatus | None = Field(default=None)
    output: dict[str, object] | None = Field(default=None)
    error: str | None = Field(default=None)
    attempts: int | None = Field(default=None, ge=0)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "AIAgentTaskUpdate":
        has_value = any(getattr(self, field) is not None for field in self.__class__.model_fields)
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    def to_update_dict(self) -> dict[str, object]:
        return {k: v for k, v in self.model_dump(mode="json").items() if v is not None}


class AIAgentTaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    task_type: str
    status: str
    priority: int
    input: dict[str, object]
    output: dict[str, object] | None
    error: str | None
    session_id: UUID | None
    attempts: int
    max_attempts: int
    scheduled_for: datetime
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    @classmethod
    def from_row(cls, row: AIAgentTaskRow) -> "AIAgentTaskResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            task_type=row.task_type,
            status=row.status,
            priority=row.priority,
            input=row.input,
            output=row.output,
            error=row.error,
            session_id=row.session_id,
            attempts=row.attempts,
            max_attempts=row.max_attempts,
            scheduled_for=row.scheduled_for,
            started_at=row.started_at,
            completed_at=row.completed_at,
            created_at=row.created_at,
        )


class AIAgentTaskListResponse(BaseModel):
    items: list[AIAgentTaskResponse]
