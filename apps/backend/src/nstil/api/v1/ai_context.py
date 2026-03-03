from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from nstil.api.deps import (
    get_ai_context_service,
    get_ai_prompt_service,
    get_current_user,
    get_prompt_engine,
)
from nstil.models import (
    AIContextResponse,
    AIPromptCreate,
    AIPromptListResponse,
    AIPromptResponse,
    AIPromptUpdate,
    CursorParams,
    MoodCategory,
    PromptSource,
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


_CLIENT_ALLOWED_SOURCES: frozenset[PromptSource] = frozenset(
    {
        PromptSource.ON_DEVICE_LLM,
        PromptSource.CLOUD_LLM,
    }
)


class CreatePromptRequest(BaseModel):
    prompt_type: PromptType = Field(...)
    content: str = Field(..., min_length=1, max_length=10_000)
    source: PromptSource = Field(...)
    mood_category: MoodCategory | None = Field(default=None)
    session_id: UUID | None = Field(default=None)
    entry_id: UUID | None = Field(default=None)
    context: dict[str, object] = Field(default_factory=dict)

    @field_validator("source")
    @classmethod
    def restrict_source(cls, v: PromptSource) -> PromptSource:
        if v not in _CLIENT_ALLOWED_SOURCES:
            allowed = ", ".join(s.value for s in _CLIENT_ALLOWED_SOURCES)
            msg = f"Client source must be one of: {allowed}"
            raise ValueError(msg)
        return v


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
    next_cursor = rows[-1].created_at.isoformat() if has_more and rows else None
    return AIPromptListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get(
    "/prompts/entry/{entry_id}",
    response_model=AIPromptResponse | None,
)
async def get_entry_reflection(
    entry_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
    prompt_type: Annotated[str | None, Query(alias="type")] = None,
) -> AIPromptResponse | None:
    row = await service.get_by_entry_id(
        UUID(user.sub),
        entry_id,
        prompt_type=prompt_type,
    )
    if row is None:
        return None
    return AIPromptResponse.from_row(row)


@router.post(
    "/prompts",
    response_model=AIPromptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_prompt(
    data: CreatePromptRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    service: Annotated[AIPromptService, Depends(get_ai_prompt_service)],
) -> AIPromptResponse:
    create_data = AIPromptCreate(
        prompt_type=data.prompt_type,
        content=data.content,
        source=data.source,
        mood_category=data.mood_category,
        session_id=data.session_id,
        entry_id=data.entry_id,
        context=data.context,
    )
    row = await service.create(UUID(user.sub), create_data)
    return AIPromptResponse.from_row(row)


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
