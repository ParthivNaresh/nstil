from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from nstil.api.deps import get_check_in_orchestrator, get_current_user
from nstil.models import (
    AISessionResponse,
    JournalEntryResponse,
    MoodCategory,
    MoodSpecific,
    TriggerSource,
    UserPayload,
)
from nstil.services.ai.check_in import CheckInError, CheckInOrchestrator, CheckInResult

router = APIRouter(prefix="/check-in", tags=["check-in"])


class StartCheckInRequest(BaseModel):
    trigger_source: TriggerSource = Field(default=TriggerSource.MANUAL)


class RespondCheckInRequest(BaseModel):
    mood_category: MoodCategory = Field(...)
    mood_specific: MoodSpecific | None = Field(default=None)
    response_text: str = Field(default="", max_length=50_000)


class ConvertCheckInRequest(BaseModel):
    journal_id: UUID | None = Field(default=None)
    title: str = Field(default="", max_length=200)


class CheckInResponse(BaseModel):
    session: AISessionResponse
    prompt_content: str | None = None
    entry: JournalEntryResponse | None = None


def _build_response(result: CheckInResult) -> CheckInResponse:
    return CheckInResponse(
        session=AISessionResponse.from_row(result.session),
        prompt_content=result.prompt_content,
        entry=(JournalEntryResponse.from_row(result.entry) if result.entry is not None else None),
    )


@router.post(
    "/start",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_check_in(
    data: StartCheckInRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    try:
        result = await orchestrator.start(UUID(user.sub), trigger_source=data.trigger_source)
    except CheckInError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.message,
        ) from exc
    return _build_response(result)


@router.post(
    "/{session_id}/respond",
    response_model=CheckInResponse,
)
async def respond_check_in(
    session_id: UUID,
    data: RespondCheckInRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    try:
        result = await orchestrator.respond(
            user_id=UUID(user.sub),
            session_id=session_id,
            mood_category=data.mood_category,
            mood_specific=data.mood_specific,
            response_text=data.response_text,
        )
    except CheckInError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.message,
        ) from exc
    return _build_response(result)


@router.post(
    "/{session_id}/convert",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
async def convert_check_in(
    session_id: UUID,
    data: ConvertCheckInRequest,
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    try:
        result = await orchestrator.convert_to_entry(
            user_id=UUID(user.sub),
            session_id=session_id,
            journal_id=data.journal_id,
            title=data.title,
        )
    except CheckInError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.message,
        ) from exc
    return _build_response(result)


@router.post(
    "/{session_id}/complete",
    response_model=CheckInResponse,
)
async def complete_check_in(
    session_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    try:
        result = await orchestrator.complete(UUID(user.sub), session_id)
    except CheckInError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.message,
        ) from exc
    return _build_response(result)


@router.post(
    "/{session_id}/abandon",
    response_model=CheckInResponse,
)
async def abandon_check_in(
    session_id: UUID,
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    try:
        result = await orchestrator.abandon(UUID(user.sub), session_id)
    except CheckInError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.message,
        ) from exc
    return _build_response(result)


@router.get(
    "/active",
    response_model=CheckInResponse,
)
async def get_active_check_in(
    user: Annotated[UserPayload, Depends(get_current_user)],
    orchestrator: Annotated[CheckInOrchestrator, Depends(get_check_in_orchestrator)],
) -> CheckInResponse:
    result = await orchestrator.get_active(UUID(user.sub))
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active check-in",
        )
    return _build_response(result)
