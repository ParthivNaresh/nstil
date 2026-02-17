from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class MessageRole(StrEnum):
    SYSTEM = "system"
    ASSISTANT = "assistant"
    USER = "user"
    TOOL = "tool"


MAX_MESSAGE_CONTENT_LENGTH = 50_000


class AIMessageRow(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    role: str
    content: str
    sort_order: int
    token_count: int | None
    latency_ms: int | None
    model_id: str | None
    metadata: dict[str, object]
    created_at: datetime
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class AIMessageCreate(BaseModel):
    session_id: UUID = Field(...)
    role: MessageRole = Field(...)
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_CONTENT_LENGTH)
    sort_order: int = Field(default=0, ge=0)
    token_count: int | None = Field(default=None, ge=0)
    latency_ms: int | None = Field(default=None, ge=0)
    model_id: str | None = Field(default=None, max_length=100)
    metadata: dict[str, object] = Field(default_factory=dict)

    @classmethod
    def system(cls, session_id: UUID, content: str, **kwargs: object) -> "AIMessageCreate":
        return cls(session_id=session_id, role=MessageRole.SYSTEM, content=content, **kwargs)

    @classmethod
    def assistant(
        cls,
        session_id: UUID,
        content: str,
        sort_order: int = 0,
        **kwargs: object,
    ) -> "AIMessageCreate":
        return cls(
            session_id=session_id,
            role=MessageRole.ASSISTANT,
            content=content,
            sort_order=sort_order,
            **kwargs,
        )

    @classmethod
    def user(
        cls,
        session_id: UUID,
        content: str,
        sort_order: int = 0,
        **kwargs: object,
    ) -> "AIMessageCreate":
        return cls(
            session_id=session_id,
            role=MessageRole.USER,
            content=content,
            sort_order=sort_order,
            **kwargs,
        )


class AIMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    sort_order: int
    token_count: int | None
    latency_ms: int | None
    model_id: str | None
    metadata: dict[str, object]
    created_at: datetime

    @classmethod
    def from_row(cls, row: AIMessageRow) -> "AIMessageResponse":
        return cls(
            id=row.id,
            session_id=row.session_id,
            role=row.role,
            content=row.content,
            sort_order=row.sort_order,
            token_count=row.token_count,
            latency_ms=row.latency_ms,
            model_id=row.model_id,
            metadata=row.metadata,
            created_at=row.created_at,
        )


class AIMessageListResponse(BaseModel):
    items: list[AIMessageResponse]
