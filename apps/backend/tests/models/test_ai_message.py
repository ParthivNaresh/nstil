import uuid

import pytest
from pydantic import ValidationError

from nstil.models.ai_message import (
    MAX_MESSAGE_CONTENT_LENGTH,
    AIMessageCreate,
    AIMessageResponse,
    MessageRole,
)
from tests.factories import make_ai_message_row


class TestAIMessageCreate:
    def test_minimal(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate(
            session_id=sid,
            role=MessageRole.USER,
            content="Hello",
        )
        assert msg.session_id == sid
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"
        assert msg.sort_order == 0
        assert msg.token_count is None
        assert msg.latency_ms is None
        assert msg.model_id is None
        assert msg.metadata == {}

    def test_empty_content_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role=MessageRole.USER,
                content="",
            )

    def test_content_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role=MessageRole.USER,
                content="x" * (MAX_MESSAGE_CONTENT_LENGTH + 1),
            )

    def test_invalid_role_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role="invalid",
                content="test",
            )

    def test_negative_sort_order_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role=MessageRole.USER,
                content="test",
                sort_order=-1,
            )

    def test_negative_token_count_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role=MessageRole.USER,
                content="test",
                token_count=-1,
            )

    def test_negative_latency_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIMessageCreate(
                session_id=uuid.uuid4(),
                role=MessageRole.USER,
                content="test",
                latency_ms=-1,
            )


class TestAIMessageFactoryMethods:
    def test_system(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate.system(sid, "System prompt")
        assert msg.role == MessageRole.SYSTEM
        assert msg.content == "System prompt"
        assert msg.session_id == sid

    def test_assistant(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate.assistant(sid, "How are you?", sort_order=1)
        assert msg.role == MessageRole.ASSISTANT
        assert msg.content == "How are you?"
        assert msg.sort_order == 1

    def test_user(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate.user(sid, "I'm doing well", sort_order=2)
        assert msg.role == MessageRole.USER
        assert msg.content == "I'm doing well"
        assert msg.sort_order == 2

    def test_assistant_default_sort_order(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate.assistant(sid, "test")
        assert msg.sort_order == 0

    def test_user_default_sort_order(self) -> None:
        sid = uuid.uuid4()
        msg = AIMessageCreate.user(sid, "test")
        assert msg.sort_order == 0


class TestAIMessageResponse:
    def test_from_row(self) -> None:
        row = make_ai_message_row(
            role="assistant",
            content="How are you?",
            sort_order=1,
            token_count=15,
            latency_ms=200,
        )
        response = AIMessageResponse.from_row(row)
        assert response.id == row.id
        assert response.session_id == row.session_id
        assert response.role == "assistant"
        assert response.content == "How are you?"
        assert response.sort_order == 1
        assert response.token_count == 15
        assert response.latency_ms == 200
        assert response.created_at == row.created_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_ai_message_row()
        response = AIMessageResponse.from_row(row)
        assert not hasattr(response, "deleted_at")

    def test_from_row_excludes_user_id(self) -> None:
        row = make_ai_message_row()
        response = AIMessageResponse.from_row(row)
        assert not hasattr(response, "user_id")

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_message_row()
        response = AIMessageResponse.from_row(row)
        assert response.token_count is None
        assert response.latency_ms is None
        assert response.model_id is None
