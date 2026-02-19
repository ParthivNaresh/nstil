from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SessionType(StrEnum):
    CHECK_IN = "check_in"
    GUIDED_JOURNAL = "guided_journal"
    REFLECTION = "reflection"
    INSIGHT = "insight"
    CONVERSATION = "conversation"
    VOICE_TO_JOURNAL = "voice_to_journal"
    AGENT_TASK = "agent_task"


class SessionStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    CONVERTED = "converted"
    FAILED = "failed"


class TriggerSource(StrEnum):
    NOTIFICATION = "notification"
    MANUAL = "manual"
    APP_OPEN = "app_open"
    POST_ENTRY = "post_entry"
    SCHEDULED = "scheduled"
    WIDGET = "widget"
    SHORTCUT = "shortcut"
    AGENT = "agent"


class AISessionRow(BaseModel):
    id: UUID
    user_id: UUID
    parent_session_id: UUID | None
    session_type: str
    status: str
    entry_id: UUID | None
    trigger_source: str | None
    model_id: str | None
    flow_state: dict[str, object]
    token_count_total: int
    metadata: dict[str, object]
    created_at: datetime
    completed_at: datetime | None
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class AISessionCreate(BaseModel):
    session_type: SessionType = Field(...)
    trigger_source: TriggerSource | None = Field(default=None)
    parent_session_id: UUID | None = Field(default=None)
    entry_id: UUID | None = Field(default=None)
    model_id: str | None = Field(default=None, max_length=100)
    flow_state: dict[str, object] = Field(default_factory=dict)
    metadata: dict[str, object] = Field(default_factory=dict)


class AISessionUpdate(BaseModel):
    status: SessionStatus | None = Field(default=None)
    entry_id: UUID | None = Field(default=None)
    model_id: str | None = Field(default=None, max_length=100)
    flow_state: dict[str, object] | None = Field(default=None)
    token_count_total: int | None = Field(default=None, ge=0)
    completed_at: datetime | None = Field(default=None)
    metadata: dict[str, object] | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "AISessionUpdate":
        has_value = any(
            getattr(self, field) is not None
            for field in self.__class__.model_fields
        )
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    def to_update_dict(self) -> dict[str, object]:
        return {
            k: v
            for k, v in self.model_dump(mode="json").items()
            if v is not None
        }


class AISessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    parent_session_id: UUID | None
    session_type: str
    status: str
    entry_id: UUID | None
    trigger_source: str | None
    model_id: str | None
    flow_state: dict[str, object]
    token_count_total: int
    metadata: dict[str, object]
    created_at: datetime
    completed_at: datetime | None

    @classmethod
    def from_row(cls, row: AISessionRow) -> "AISessionResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            parent_session_id=row.parent_session_id,
            session_type=row.session_type,
            status=row.status,
            entry_id=row.entry_id,
            trigger_source=row.trigger_source,
            model_id=row.model_id,
            flow_state=row.flow_state,
            token_count_total=row.token_count_total,
            metadata=row.metadata,
            created_at=row.created_at,
            completed_at=row.completed_at,
        )


class AISessionListResponse(BaseModel):
    items: list[AISessionResponse]
    next_cursor: str | None
    has_more: bool
