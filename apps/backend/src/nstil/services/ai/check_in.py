from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from nstil.models.ai_message import AIMessageCreate
from nstil.models.ai_prompt import PromptType
from nstil.models.ai_session import (
    AISessionCreate,
    AISessionRow,
    AISessionUpdate,
    SessionStatus,
    SessionType,
    TriggerSource,
)
from nstil.models.journal import EntryType, JournalEntryCreate, JournalEntryRow
from nstil.models.mood import MoodCategory, MoodSpecific
from nstil.models.pagination import CursorParams
from nstil.observability import get_logger
from nstil.services.ai.prompt import AIPromptService
from nstil.services.ai.prompt_engine import PromptEngine
from nstil.services.ai.session import AISessionService
from nstil.services.cached_ai_context import CachedAIContextService
from nstil.services.cached_ai_profile import CachedAIProfileService
from nstil.services.cached_journal import CachedJournalService
from nstil.services.cached_space import CachedSpaceService

logger = get_logger("nstil.ai.check_in")


class CheckInStep(StrEnum):
    PROMPTED = "prompted"
    RESPONDED = "responded"
    COMPLETED = "completed"


class CheckInError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class CheckInResult:
    __slots__ = ("session", "prompt_content", "entry")

    def __init__(
        self,
        session: AISessionRow,
        prompt_content: str | None = None,
        entry: JournalEntryRow | None = None,
    ) -> None:
        self.session = session
        self.prompt_content = prompt_content
        self.entry = entry


def _validate_active_session(session: AISessionRow | None, session_id: UUID) -> AISessionRow:
    if session is None:
        raise CheckInError(f"Session {session_id} not found")
    if session.status != SessionStatus.ACTIVE.value:
        raise CheckInError(f"Session {session_id} is not active")
    if session.session_type != SessionType.CHECK_IN.value:
        raise CheckInError(f"Session {session_id} is not a check-in session")
    return session


def _get_flow_step(session: AISessionRow) -> str:
    return str(session.flow_state.get("step", ""))


def _get_flow_prompt_id(session: AISessionRow) -> UUID | None:
    raw = session.flow_state.get("prompt_id")
    if raw is None:
        return None
    return UUID(str(raw))


class CheckInOrchestrator:
    def __init__(
        self,
        session_service: AISessionService,
        prompt_engine: PromptEngine,
        prompt_service: AIPromptService,
        journal_service: CachedJournalService,
        space_service: CachedSpaceService,
        profile_service: CachedAIProfileService,
        context_service: CachedAIContextService,
    ) -> None:
        self._sessions = session_service
        self._prompt_engine = prompt_engine
        self._prompts = prompt_service
        self._journal = journal_service
        self._spaces = space_service
        self._profile = profile_service
        self._context = context_service

    async def start(
        self,
        user_id: UUID,
        trigger_source: TriggerSource = TriggerSource.MANUAL,
    ) -> CheckInResult:
        existing = await self._find_active_check_in(user_id)
        if existing is not None:
            if _get_flow_prompt_id(existing) is None:
                await self._force_abandon(user_id, existing)
            else:
                return await self._resume(user_id, existing)

        session = await self._sessions.create(
            user_id,
            AISessionCreate(
                session_type=SessionType.CHECK_IN,
                trigger_source=trigger_source,
            ),
        )

        prompt_row = await self._prompt_engine.generate(
            user_id=user_id,
            prompt_type=PromptType.CHECK_IN,
            session_id=session.id,
        )

        if prompt_row is None:
            raise CheckInError("Failed to generate check-in prompt")

        await self._prompts.mark_delivered(user_id, prompt_row.id)

        sort_order = await self._sessions.get_next_sort_order(session.id)
        await self._sessions.add_message(
            user_id,
            AIMessageCreate.assistant(
                session_id=session.id,
                content=prompt_row.content,
                sort_order=sort_order,
            ),
        )

        flow_state: dict[str, object] = {
            "step": CheckInStep.PROMPTED.value,
            "prompt_id": str(prompt_row.id),
        }
        updated_session = await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(flow_state=flow_state),
        )

        if updated_session is None:
            raise CheckInError("Failed to update session flow state")
        session = updated_session

        logger.info(
            "check_in.started",
            user_id=str(user_id),
            session_id=str(session.id),
            prompt_id=str(prompt_row.id),
        )

        return CheckInResult(
            session=session,
            prompt_content=prompt_row.content,
        )

    async def respond(
        self,
        user_id: UUID,
        session_id: UUID,
        mood_category: MoodCategory,
        mood_specific: MoodSpecific | None = None,
        response_text: str = "",
    ) -> CheckInResult:
        session = await self._sessions.get_by_id(user_id, session_id)
        session = _validate_active_session(session, session_id)

        current_step = _get_flow_step(session)
        if current_step != CheckInStep.PROMPTED.value:
            raise CheckInError(f"Cannot respond: session is in step '{current_step}'")

        prompt_id = _get_flow_prompt_id(session)
        if prompt_id is not None:
            await self._prompts.mark_engaged(user_id, prompt_id)

        if response_text.strip():
            sort_order = await self._sessions.get_next_sort_order(session.id)
            await self._sessions.add_message(
                user_id,
                AIMessageCreate.user(
                    session_id=session.id,
                    content=response_text.strip(),
                    sort_order=sort_order,
                ),
            )

        flow_state: dict[str, object] = {
            **session.flow_state,
            "step": CheckInStep.RESPONDED.value,
            "mood_category": mood_category.value,
            "mood_specific": mood_specific.value if mood_specific else None,
            "response_text": response_text.strip(),
        }
        updated = await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(flow_state=flow_state),
        )

        if updated is None:
            raise CheckInError("Failed to update session")
        session = updated

        now = datetime.now(UTC).isoformat()
        await self._profile.update_last_check_in(user_id, now)
        await self._context.invalidate(user_id)

        logger.info(
            "check_in.responded",
            user_id=str(user_id),
            session_id=str(session.id),
            mood=mood_category.value,
        )

        return CheckInResult(session=session)

    async def convert_to_entry(
        self,
        user_id: UUID,
        session_id: UUID,
        journal_id: UUID | None = None,
        title: str = "",
    ) -> CheckInResult:
        session = await self._sessions.get_by_id(user_id, session_id)
        session = _validate_active_session(session, session_id)

        current_step = _get_flow_step(session)
        if current_step != CheckInStep.RESPONDED.value:
            raise CheckInError(f"Cannot convert: session is in step '{current_step}'")

        target_journal_id = journal_id
        if target_journal_id is None:
            default_space = await self._spaces.get_default(user_id)
            if default_space is None:
                raise CheckInError("No journal found for user")
            target_journal_id = default_space.id

        mood_cat_raw = session.flow_state.get("mood_category")
        mood_spec_raw = session.flow_state.get("mood_specific")
        response_text = str(session.flow_state.get("response_text", ""))

        mood_category = MoodCategory(str(mood_cat_raw)) if mood_cat_raw else None
        mood_specific = MoodSpecific(str(mood_spec_raw)) if mood_spec_raw else None

        entry = await self._journal.create(
            user_id,
            JournalEntryCreate(
                journal_id=target_journal_id,
                title=title,
                body=response_text,
                mood_category=mood_category,
                mood_specific=mood_specific,
                entry_type=EntryType.CHECK_IN,
            ),
        )

        prompt_id = _get_flow_prompt_id(session)
        if prompt_id is not None:
            await self._prompts.mark_converted(user_id, prompt_id, entry.id)

        now = datetime.now(UTC).isoformat()
        flow_state: dict[str, object] = {
            **session.flow_state,
            "step": CheckInStep.COMPLETED.value,
            "entry_id": str(entry.id),
        }
        updated_session = await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(
                status=SessionStatus.CONVERTED,
                entry_id=entry.id,
                flow_state=flow_state,
                completed_at=now,
            ),
        )

        if updated_session is None:
            raise CheckInError("Failed to update session")
        session = updated_session

        await self._context.invalidate(user_id)

        logger.info(
            "check_in.converted",
            user_id=str(user_id),
            session_id=str(session.id),
            entry_id=str(entry.id),
        )

        return CheckInResult(session=session, entry=entry)

    async def complete(
        self,
        user_id: UUID,
        session_id: UUID,
    ) -> CheckInResult:
        session = await self._sessions.get_by_id(user_id, session_id)
        session = _validate_active_session(session, session_id)

        current_step = _get_flow_step(session)
        if current_step != CheckInStep.RESPONDED.value:
            raise CheckInError(f"Cannot complete: session is in step '{current_step}'")

        now = datetime.now(UTC).isoformat()
        flow_state: dict[str, object] = {
            **session.flow_state,
            "step": CheckInStep.COMPLETED.value,
        }
        updated_session = await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(
                status=SessionStatus.COMPLETED,
                flow_state=flow_state,
                completed_at=now,
            ),
        )

        if updated_session is None:
            raise CheckInError("Failed to update session")
        session = updated_session

        logger.info(
            "check_in.completed",
            user_id=str(user_id),
            session_id=str(session.id),
        )

        return CheckInResult(session=session)

    async def abandon(
        self,
        user_id: UUID,
        session_id: UUID,
    ) -> CheckInResult:
        session = await self._sessions.get_by_id(user_id, session_id)
        session = _validate_active_session(session, session_id)

        now = datetime.now(UTC).isoformat()
        updated_session = await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(
                status=SessionStatus.ABANDONED,
                completed_at=now,
            ),
        )

        if updated_session is None:
            raise CheckInError("Failed to update session")
        session = updated_session

        prompt_id = _get_flow_prompt_id(session)
        if prompt_id is not None:
            await self._prompts.mark_dismissed(user_id, prompt_id)

        logger.info(
            "check_in.abandoned",
            user_id=str(user_id),
            session_id=str(session.id),
        )

        return CheckInResult(session=session)

    async def get_active(self, user_id: UUID) -> CheckInResult | None:
        session = await self._find_active_check_in(user_id)
        if session is None:
            return None
        return await self._resume(user_id, session)

    async def _find_active_check_in(self, user_id: UUID) -> AISessionRow | None:
        rows, _ = await self._sessions.list_sessions(
            user_id,
            CursorParams(limit=1),
            session_type=SessionType.CHECK_IN.value,
            status=SessionStatus.ACTIVE.value,
        )
        if not rows:
            return None
        return rows[0]

    async def _force_abandon(self, user_id: UUID, session: AISessionRow) -> None:
        now = datetime.now(UTC).isoformat()
        await self._sessions.update(
            user_id,
            session.id,
            AISessionUpdate(
                status=SessionStatus.ABANDONED,
                completed_at=now,
            ),
        )
        logger.warning(
            "check_in.orphaned_session_abandoned",
            user_id=str(user_id),
            session_id=str(session.id),
        )

    async def _resume(
        self,
        user_id: UUID,
        session: AISessionRow,
    ) -> CheckInResult:
        prompt_content: str | None = None
        prompt_id = _get_flow_prompt_id(session)
        if prompt_id is not None:
            prompt_row = await self._prompts.get_by_id(user_id, prompt_id)
            if prompt_row is not None:
                prompt_content = prompt_row.content

        logger.info(
            "check_in.resumed",
            user_id=str(user_id),
            session_id=str(session.id),
            step=_get_flow_step(session),
        )

        return CheckInResult(
            session=session,
            prompt_content=prompt_content,
        )
