from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from nstil.api.deps import (
    get_ai_insight_service,
    get_current_user,
    get_insight_engine,
)
from nstil.models import (
    AIInsightCreate,
    AIInsightListResponse,
    AIInsightResponse,
    AIInsightUpdate,
    CursorParams,
    InsightSource,
    InsightType,
    UserPayload,
)
from nstil.services.ai.insight import AIInsightService
from nstil.services.ai.insight_engine import InsightEngine

router = APIRouter(prefix="/insights", tags=["insights"])


_CLIENT_ALLOWED_SOURCES: frozenset[InsightSource] = frozenset(
    {
        InsightSource.ON_DEVICE_LLM,
        InsightSource.CLOUD_LLM,
    }
)


class CreateInsightRequest(BaseModel):
    insight_type: InsightType = Field(...)
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1, max_length=50_000)
    source: InsightSource = Field(...)
    supporting_entry_ids: list[UUID] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    period_start: date | None = Field(default=None)
    period_end: date | None = Field(default=None)
    metadata: dict[str, object] = Field(default_factory=dict)

    @field_validator("source")
    @classmethod
    def restrict_source(cls, v: InsightSource) -> InsightSource:
        if v not in _CLIENT_ALLOWED_SOURCES:
            allowed = ", ".join(s.value for s in _CLIENT_ALLOWED_SOURCES)
            msg = f"Client source must be one of: {allowed}"
            raise ValueError(msg)
        return v


@router.get("", response_model=AIInsightListResponse)
async def list_insights(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIInsightService, Depends(get_ai_insight_service)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    insight_type: Annotated[str | None, Query(alias="type")] = None,
    insight_status: Annotated[str | None, Query(alias="status")] = None,
    insight_source: Annotated[str | None, Query(alias="source")] = None,
) -> AIInsightListResponse:
    params = CursorParams(cursor=cursor, limit=limit)
    rows, has_more = await service.list_insights(
        UUID(user.sub),
        params,
        insight_type=insight_type,
        status=insight_status,
        source=insight_source,
    )
    items = [AIInsightResponse.from_row(row) for row in rows]
    next_cursor = rows[-1].created_at.isoformat() if has_more and rows else None
    return AIInsightListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.post(
    "",
    response_model=AIInsightResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_insight(
    data: CreateInsightRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIInsightService, Depends(get_ai_insight_service)],
) -> AIInsightResponse:
    create_data = AIInsightCreate(
        insight_type=data.insight_type,
        title=data.title,
        content=data.content,
        source=data.source,
        supporting_entry_ids=data.supporting_entry_ids,
        confidence=data.confidence,
        period_start=data.period_start,
        period_end=data.period_end,
        metadata=data.metadata,
    )
    row = await service.create(UUID(user.sub), create_data)
    return AIInsightResponse.from_row(row)


@router.post(
    "/generate",
    response_model=list[AIInsightResponse],
)
async def generate_insights(
    user: Annotated[UserPayload, Depends(get_current_user)],
    engine: Annotated[InsightEngine, Depends(get_insight_engine)],
) -> list[AIInsightResponse]:
    rows = await engine.run(UUID(user.sub))
    return [AIInsightResponse.from_row(row) for row in rows]


@router.patch("/{insight_id}", response_model=AIInsightResponse)
async def update_insight(
    insight_id: UUID,
    data: AIInsightUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIInsightService, Depends(get_ai_insight_service)],
) -> AIInsightResponse:
    row = await service.update(UUID(user.sub), insight_id, data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )
    return AIInsightResponse.from_row(row)
