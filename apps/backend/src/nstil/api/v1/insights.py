from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from nstil.api.deps import (
    get_ai_insight_service,
    get_current_user,
    get_insight_engine,
)
from nstil.models import (
    AIInsightListResponse,
    AIInsightResponse,
    AIInsightUpdate,
    CursorParams,
    UserPayload,
)
from nstil.services.ai.insight import AIInsightService
from nstil.services.ai.insight_engine import InsightEngine

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=AIInsightListResponse)
async def list_insights(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIInsightService, Depends(get_ai_insight_service)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    insight_type: Annotated[str | None, Query(alias="type")] = None,
    insight_status: Annotated[str | None, Query(alias="status")] = None,
) -> AIInsightListResponse:
    params = CursorParams(cursor=cursor, limit=limit)
    rows, has_more = await service.list_insights(
        UUID(user.sub),
        params,
        insight_type=insight_type,
        status=insight_status,
    )
    items = [AIInsightResponse.from_row(row) for row in rows]
    next_cursor = (
        rows[-1].created_at.isoformat() if has_more and rows else None
    )
    return AIInsightListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


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
