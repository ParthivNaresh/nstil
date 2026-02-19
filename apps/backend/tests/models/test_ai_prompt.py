import uuid

import pytest
from pydantic import ValidationError

from nstil.models.ai_prompt import (
    MAX_PROMPT_CONTENT_LENGTH,
    AIPromptCreate,
    AIPromptResponse,
    AIPromptUpdate,
    PromptSource,
    PromptStatus,
    PromptType,
)
from tests.factories import make_ai_prompt_row


class TestAIPromptCreate:
    def test_minimal(self) -> None:
        prompt = AIPromptCreate(
            prompt_type=PromptType.CHECK_IN,
            content="How are you feeling?",
        )
        assert prompt.prompt_type == PromptType.CHECK_IN
        assert prompt.content == "How are you feeling?"
        assert prompt.source == PromptSource.CURATED
        assert prompt.mood_category is None
        assert prompt.session_id is None
        assert prompt.entry_id is None
        assert prompt.context == {}

    def test_all_fields(self) -> None:
        sid = uuid.uuid4()
        eid = uuid.uuid4()
        prompt = AIPromptCreate(
            prompt_type=PromptType.REFLECTION,
            content="Take a moment to reflect.",
            source=PromptSource.ON_DEVICE_LLM,
            mood_category="happy",
            session_id=sid,
            entry_id=eid,
            context={"key": "value"},
        )
        assert prompt.prompt_type == PromptType.REFLECTION
        assert prompt.source == PromptSource.ON_DEVICE_LLM
        assert prompt.mood_category == "happy"
        assert prompt.session_id == sid
        assert prompt.entry_id == eid
        assert prompt.context == {"key": "value"}

    def test_content_stripped(self) -> None:
        prompt = AIPromptCreate(
            prompt_type=PromptType.NUDGE,
            content="  Hello there  ",
        )
        assert prompt.content == "Hello there"

    def test_empty_content_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIPromptCreate(prompt_type=PromptType.CHECK_IN, content="")

    def test_whitespace_only_content_rejected(self) -> None:
        with pytest.raises(ValidationError, match="blank"):
            AIPromptCreate(prompt_type=PromptType.CHECK_IN, content="   ")

    def test_content_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIPromptCreate(
                prompt_type=PromptType.CHECK_IN,
                content="x" * (MAX_PROMPT_CONTENT_LENGTH + 1),
            )

    def test_invalid_prompt_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIPromptCreate(prompt_type="invalid", content="test")

    def test_invalid_source_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIPromptCreate(
                prompt_type=PromptType.CHECK_IN,
                content="test",
                source="invalid",
            )

    def test_all_prompt_types_accepted(self) -> None:
        for pt in PromptType:
            prompt = AIPromptCreate(prompt_type=pt, content="test")
            assert prompt.prompt_type == pt


class TestAIPromptUpdate:
    def test_single_field(self) -> None:
        update = AIPromptUpdate(status=PromptStatus.DELIVERED)
        assert update.status == PromptStatus.DELIVERED

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            AIPromptUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = AIPromptUpdate(status=PromptStatus.SEEN)
        result = update.to_update_dict()
        assert result == {"status": "seen"}
        assert "converted_entry_id" not in result
        assert "delivered_at" not in result

    def test_multiple_fields(self) -> None:
        eid = uuid.uuid4()
        update = AIPromptUpdate(
            status=PromptStatus.CONVERTED,
            converted_entry_id=eid,
        )
        result = update.to_update_dict()
        assert result["status"] == "converted"
        assert result["converted_entry_id"] == str(eid)

    def test_invalid_status_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIPromptUpdate(status="invalid")


class TestAIPromptResponse:
    def test_from_row(self) -> None:
        row = make_ai_prompt_row(
            prompt_type="reflection",
            content="Reflect on your day",
            source="curated",
            mood_category="calm",
            status="delivered",
        )
        response = AIPromptResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.prompt_type == "reflection"
        assert response.content == "Reflect on your day"
        assert response.source == "curated"
        assert response.mood_category == "calm"
        assert response.status == "delivered"
        assert response.created_at == row.created_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_ai_prompt_row()
        response = AIPromptResponse.from_row(row)
        assert not hasattr(response, "deleted_at")

    def test_from_row_with_session_and_entry(self) -> None:
        sid = str(uuid.uuid4())
        eid = str(uuid.uuid4())
        row = make_ai_prompt_row(session_id=sid, entry_id=eid)
        response = AIPromptResponse.from_row(row)
        assert response.session_id == uuid.UUID(sid)
        assert response.entry_id == uuid.UUID(eid)

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_prompt_row()
        response = AIPromptResponse.from_row(row)
        assert response.mood_category is None
        assert response.session_id is None
        assert response.entry_id is None
        assert response.converted_entry_id is None
        assert response.delivered_at is None
        assert response.seen_at is None
        assert response.engaged_at is None
        assert response.dismissed_at is None
        assert response.converted_at is None
