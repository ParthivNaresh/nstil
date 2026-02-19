import uuid

import pytest
from pydantic import ValidationError

from nstil.models.ai_session import (
    AISessionCreate,
    AISessionResponse,
    AISessionUpdate,
    SessionStatus,
    SessionType,
    TriggerSource,
)
from tests.factories import make_ai_session_row


class TestAISessionCreate:
    def test_minimal(self) -> None:
        session = AISessionCreate(session_type=SessionType.CHECK_IN)
        assert session.session_type == SessionType.CHECK_IN
        assert session.trigger_source is None
        assert session.parent_session_id is None
        assert session.entry_id is None
        assert session.model_id is None
        assert session.flow_state == {}
        assert session.metadata == {}

    def test_all_fields(self) -> None:
        pid = uuid.uuid4()
        eid = uuid.uuid4()
        session = AISessionCreate(
            session_type=SessionType.GUIDED_JOURNAL,
            trigger_source=TriggerSource.NOTIFICATION,
            parent_session_id=pid,
            entry_id=eid,
            model_id="gpt-4",
            flow_state={"step": "start"},
            metadata={"source": "test"},
        )
        assert session.session_type == SessionType.GUIDED_JOURNAL
        assert session.trigger_source == TriggerSource.NOTIFICATION
        assert session.parent_session_id == pid
        assert session.entry_id == eid
        assert session.model_id == "gpt-4"

    def test_invalid_session_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AISessionCreate(session_type="invalid")

    def test_invalid_trigger_source_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AISessionCreate(
                session_type=SessionType.CHECK_IN,
                trigger_source="invalid",
            )

    def test_all_session_types_accepted(self) -> None:
        for st in SessionType:
            session = AISessionCreate(session_type=st)
            assert session.session_type == st

    def test_all_trigger_sources_accepted(self) -> None:
        for ts in TriggerSource:
            session = AISessionCreate(
                session_type=SessionType.CHECK_IN,
                trigger_source=ts,
            )
            assert session.trigger_source == ts


class TestAISessionUpdate:
    def test_single_field(self) -> None:
        update = AISessionUpdate(status=SessionStatus.COMPLETED)
        assert update.status == SessionStatus.COMPLETED

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            AISessionUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = AISessionUpdate(status=SessionStatus.ABANDONED)
        result = update.to_update_dict()
        assert result == {"status": "abandoned"}
        assert "entry_id" not in result
        assert "flow_state" not in result

    def test_flow_state_update(self) -> None:
        update = AISessionUpdate(flow_state={"step": "responded", "mood": "happy"})
        result = update.to_update_dict()
        assert result["flow_state"] == {"step": "responded", "mood": "happy"}

    def test_token_count_negative_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AISessionUpdate(token_count_total=-1)

    def test_token_count_zero_accepted(self) -> None:
        update = AISessionUpdate(token_count_total=0)
        assert update.token_count_total == 0

    def test_invalid_status_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AISessionUpdate(status="invalid")


class TestAISessionResponse:
    def test_from_row(self) -> None:
        row = make_ai_session_row(
            session_type="check_in",
            status="active",
            trigger_source="manual",
            token_count_total=42,
        )
        response = AISessionResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.session_type == "check_in"
        assert response.status == "active"
        assert response.trigger_source == "manual"
        assert response.token_count_total == 42
        assert response.flow_state == {}
        assert response.metadata == {}
        assert response.created_at == row.created_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_ai_session_row()
        response = AISessionResponse.from_row(row)
        assert not hasattr(response, "deleted_at")

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_session_row(
            entry_id=None,
            trigger_source=None,
            model_id=None,
            completed_at=None,
        )
        response = AISessionResponse.from_row(row)
        assert response.entry_id is None
        assert response.trigger_source is None
        assert response.model_id is None
        assert response.completed_at is None
        assert response.parent_session_id is None

    def test_from_row_with_flow_state(self) -> None:
        row = make_ai_session_row(flow_state={"step": "prompted", "prompt_id": "abc"})
        response = AISessionResponse.from_row(row)
        assert response.flow_state == {"step": "prompted", "prompt_id": "abc"}
