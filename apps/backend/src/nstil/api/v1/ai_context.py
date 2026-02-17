from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from nstil.api.deps import (
    get_ai_context_service,
    get_ai_prompt_service,
    get_current_user,
    get_prompt_engine,
)
from nstil.models import (
    AIContextResponse,
    AIPromptListResponse,
    AIPromptResponse,
    AIPromptUpdate,
    CursorParams,
    PromptType,
    UserPayload,
)
from nstil.services.ai.prompt import AIPromptService
from nstil.services.ai.prompt_engine import PromptEngine
from nstil.services.cached_ai_context import CachedAIContextService

router = APIRouter(prefix="/ai", tags=["ai-context"])


class GeneratePromptRequest(BaseModel):
    prompt_type: PromptType | None = Field(default=None)
    entry_id: UUID | None = Field(default=None)


@router.get("/context", response_model=AIContextResponse)
async def get_ai_context(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[CachedAIContextService, Depends(get_ai_context_service)],
    entry_limit: Annotated[int, Query(ge=1, le=100)] = 10,
    days_back: Annotated[int, Query(ge=1, le=90)] = 14,
) -> AIContextResponse:
    return await service.get_context(
        UUID(user.sub),
        entry_limit=entry_limit,
        days_back=days_back,
    )


@router.get("/prompts", response_model=AIPromptListResponse)
async def list_prompts(
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    prompt_type: Annotated[str | None, Query(alias="type")] = None,
    prompt_status: Annotated[str | None, Query(alias="status")] = None,
) -> AIPromptListResponse:
    params = CursorParams(cursor=cursor, limit=limit)
    rows, has_more = await service.list_prompts(
        UUID(user.sub),
        params,
        prompt_type=prompt_type,
        status=prompt_status,
    )
    items = [AIPromptResponse.from_row(row) for row in rows]
    next_cursor = (
        rows[-1].created_at.isoformat() if has_more and rows else None
    )
    return AIPromptListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.post(
    "/prompts/generate",
    response_model=AIPromptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_prompt(
    data: GeneratePromptRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    engine: Annotated[PromptEngine, Depends(get_prompt_engine)],
) -> AIPromptResponse:
    row = await engine.generate(
        user_id=UUID(user.sub),
        prompt_type=data.prompt_type,
        entry_id=data.entry_id,
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No prompt available for the current context",
        )
    return AIPromptResponse.from_row(row)


@router.patch("/prompts/{prompt_id}", response_model=AIPromptResponse)
async def update_prompt(
    prompt_id: UUID,
    data: AIPromptUpdate,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
) -> AIPromptResponse:
    row = await service.update(UUID(user.sub), prompt_id, data)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    return AIPromptResponse.from_row(row)
