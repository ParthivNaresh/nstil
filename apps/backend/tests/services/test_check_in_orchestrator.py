from __future__ import annotations

import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.journal import EntryType
from nstil.models.mood import MoodCategory, MoodSpecific
from nstil.services.ai.check_in import CheckInError, CheckInOrchestrator, CheckInStep
from tests.factories import (
    DEFAULT_JOURNAL_ID,
    DEFAULT_USER_ID,
    make_ai_session_row,
    make_entry_row,
    make_space_row,
)

USER_ID = uuid.UUID(DEFAULT_USER_ID)
JOURNAL_ID = uuid.UUID(DEFAULT_JOURNAL_ID)


def _responded_flow_state(
    mood_category: str = "happy",
    mood_specific: str | None = None,
    response_text: str = "",
) -> dict[str, object]:
    return {
        "step": CheckInStep.RESPONDED.value,
        "prompt_id": str(uuid.uuid4()),
        "mood_category": mood_category,
        "mood_specific": mood_specific,
        "response_text": response_text,
    }


def _build_orchestrator(
    *,
    session_service: AsyncMock | None = None,
    journal_service: AsyncMock | None = None,
    space_service: AsyncMock | None = None,
    context_service: AsyncMock | None = None,
) -> CheckInOrchestrator:
    return CheckInOrchestrator(
        session_service=session_service or AsyncMock(),
        prompt_engine=AsyncMock(),
        prompt_service=AsyncMock(),
        journal_service=journal_service or AsyncMock(),
        space_service=space_service or AsyncMock(),
        profile_service=AsyncMock(),
        context_service=context_service or AsyncMock(),
    )


class TestComplete:
    @pytest.mark.asyncio
    async def test_creates_mood_snapshot_entry(self) -> None:
        flow = _responded_flow_state(mood_category="calm", mood_specific="content")
        session = make_ai_session_row(flow_state=flow)
        completed_session = make_ai_session_row(status="completed", flow_state=flow)
        entry = make_entry_row(
            entry_type="mood_snapshot",
            mood_category="calm",
            body="",
            title="",
        )
        space = make_space_row()

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session
        sessions_mock.update.return_value = completed_session

        journal_mock = AsyncMock()
        journal_mock.create.return_value = entry

        space_mock = AsyncMock()
        space_mock.get_default.return_value = space

        context_mock = AsyncMock()

        orchestrator = _build_orchestrator(
            session_service=sessions_mock,
            journal_service=journal_mock,
            space_service=space_mock,
            context_service=context_mock,
        )

        result = await orchestrator.complete(USER_ID, session.id)

        journal_mock.create.assert_called_once()
        create_call = journal_mock.create.call_args
        create_data = create_call[0][1]
        assert create_data.entry_type == EntryType.MOOD_SNAPSHOT
        assert create_data.mood_category == MoodCategory.CALM
        assert create_data.mood_specific == MoodSpecific.CONTENT
        assert create_data.journal_id == space.id

        assert result.entry is not None
        assert result.entry.id == entry.id

    @pytest.mark.asyncio
    async def test_creates_entry_with_mood_specific_none(self) -> None:
        flow = _responded_flow_state(mood_category="sad", mood_specific=None)
        session = make_ai_session_row(flow_state=flow)
        completed_session = make_ai_session_row(status="completed", flow_state=flow)
        entry = make_entry_row(
            entry_type="mood_snapshot",
            mood_category="sad",
            body="",
            title="",
        )
        space = make_space_row()

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session
        sessions_mock.update.return_value = completed_session

        journal_mock = AsyncMock()
        journal_mock.create.return_value = entry

        space_mock = AsyncMock()
        space_mock.get_default.return_value = space

        orchestrator = _build_orchestrator(
            session_service=sessions_mock,
            journal_service=journal_mock,
            space_service=space_mock,
        )

        result = await orchestrator.complete(USER_ID, session.id)

        create_data = journal_mock.create.call_args[0][1]
        assert create_data.mood_specific is None
        assert result.entry is not None

    @pytest.mark.asyncio
    async def test_links_entry_to_session(self) -> None:
        flow = _responded_flow_state(mood_category="happy")
        session = make_ai_session_row(flow_state=flow)
        completed_session = make_ai_session_row(status="completed", flow_state=flow)
        entry = make_entry_row(
            entry_type="mood_snapshot",
            mood_category="happy",
            body="",
            title="",
        )
        space = make_space_row()

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session
        sessions_mock.update.return_value = completed_session

        journal_mock = AsyncMock()
        journal_mock.create.return_value = entry

        space_mock = AsyncMock()
        space_mock.get_default.return_value = space

        orchestrator = _build_orchestrator(
            session_service=sessions_mock,
            journal_service=journal_mock,
            space_service=space_mock,
        )

        await orchestrator.complete(USER_ID, session.id)

        update_call = sessions_mock.update.call_args
        session_update = update_call[0][2]
        assert session_update.entry_id == entry.id
        assert session_update.status == "completed"

    @pytest.mark.asyncio
    async def test_invalidates_ai_context(self) -> None:
        flow = _responded_flow_state(mood_category="anxious")
        session = make_ai_session_row(flow_state=flow)
        completed_session = make_ai_session_row(status="completed", flow_state=flow)
        entry = make_entry_row(
            entry_type="mood_snapshot",
            mood_category="anxious",
            body="",
            title="",
        )
        space = make_space_row()

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session
        sessions_mock.update.return_value = completed_session

        journal_mock = AsyncMock()
        journal_mock.create.return_value = entry

        space_mock = AsyncMock()
        space_mock.get_default.return_value = space

        context_mock = AsyncMock()

        orchestrator = _build_orchestrator(
            session_service=sessions_mock,
            journal_service=journal_mock,
            space_service=space_mock,
            context_service=context_mock,
        )

        await orchestrator.complete(USER_ID, session.id)

        context_mock.invalidate.assert_called_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_rejects_non_responded_step(self) -> None:
        flow = {"step": CheckInStep.PROMPTED.value, "prompt_id": str(uuid.uuid4())}
        session = make_ai_session_row(flow_state=flow)

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session

        orchestrator = _build_orchestrator(session_service=sessions_mock)

        with pytest.raises(CheckInError, match="Cannot complete"):
            await orchestrator.complete(USER_ID, session.id)

    @pytest.mark.asyncio
    async def test_rejects_non_active_session(self) -> None:
        session = make_ai_session_row(status="completed")

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session

        orchestrator = _build_orchestrator(session_service=sessions_mock)

        with pytest.raises(CheckInError, match="is not active"):
            await orchestrator.complete(USER_ID, session.id)

    @pytest.mark.asyncio
    async def test_raises_when_no_default_journal(self) -> None:
        flow = _responded_flow_state(mood_category="happy")
        session = make_ai_session_row(flow_state=flow)

        sessions_mock = AsyncMock()
        sessions_mock.get_by_id.return_value = session

        space_mock = AsyncMock()
        space_mock.get_default.return_value = None

        orchestrator = _build_orchestrator(
            session_service=sessions_mock,
            space_service=space_mock,
        )

        with pytest.raises(CheckInError, match="No journal found"):
            await orchestrator.complete(USER_ID, session.id)


class TestExtractMoodFromFlow:
    def test_extracts_both(self) -> None:
        flow: dict[str, object] = {"mood_category": "happy", "mood_specific": "grateful"}
        cat, spec = CheckInOrchestrator._extract_mood_from_flow(flow)
        assert cat == MoodCategory.HAPPY
        assert spec == MoodSpecific.GRATEFUL

    def test_extracts_category_only(self) -> None:
        flow: dict[str, object] = {"mood_category": "sad", "mood_specific": None}
        cat, spec = CheckInOrchestrator._extract_mood_from_flow(flow)
        assert cat == MoodCategory.SAD
        assert spec is None

    def test_returns_none_when_missing(self) -> None:
        flow: dict[str, object] = {}
        cat, spec = CheckInOrchestrator._extract_mood_from_flow(flow)
        assert cat is None
        assert spec is None
