import uuid
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from nstil.models.ai_task import (
    MAX_TASK_PRIORITY,
    AIAgentTaskCreate,
    AIAgentTaskResponse,
    AIAgentTaskUpdate,
    TaskStatus,
    TaskType,
)
from tests.factories import make_ai_task_row


class TestAIAgentTaskCreate:
    def test_minimal(self) -> None:
        uid = uuid.uuid4()
        task = AIAgentTaskCreate(
            user_id=uid,
            task_type=TaskType.GENERATE_INSIGHT,
        )
        assert task.user_id == uid
        assert task.task_type == TaskType.GENERATE_INSIGHT
        assert task.priority == 0
        assert task.input == {}
        assert task.session_id is None
        assert task.max_attempts == 3
        assert task.scheduled_for is None

    def test_all_fields(self) -> None:
        uid = uuid.uuid4()
        sid = uuid.uuid4()
        scheduled = datetime.now(UTC)
        task = AIAgentTaskCreate(
            user_id=uid,
            task_type=TaskType.WEEKLY_SUMMARY,
            priority=5,
            input={"week": "2025-01-06"},
            session_id=sid,
            max_attempts=5,
            scheduled_for=scheduled,
        )
        assert task.priority == 5
        assert task.input == {"week": "2025-01-06"}
        assert task.session_id == sid
        assert task.max_attempts == 5
        assert task.scheduled_for == scheduled

    def test_invalid_task_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type="invalid",
            )

    def test_priority_too_high_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=TaskType.GENERATE_INSIGHT,
                priority=MAX_TASK_PRIORITY + 1,
            )

    def test_priority_negative_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=TaskType.GENERATE_INSIGHT,
                priority=-1,
            )

    def test_priority_boundary_values(self) -> None:
        for p in [0, MAX_TASK_PRIORITY]:
            task = AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=TaskType.GENERATE_INSIGHT,
                priority=p,
            )
            assert task.priority == p

    def test_max_attempts_too_low_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=TaskType.GENERATE_INSIGHT,
                max_attempts=0,
            )

    def test_max_attempts_too_high_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=TaskType.GENERATE_INSIGHT,
                max_attempts=11,
            )

    def test_all_task_types_accepted(self) -> None:
        for tt in TaskType:
            task = AIAgentTaskCreate(
                user_id=uuid.uuid4(),
                task_type=tt,
            )
            assert task.task_type == tt


class TestAIAgentTaskUpdate:
    def test_single_field(self) -> None:
        update = AIAgentTaskUpdate(status=TaskStatus.RUNNING)
        assert update.status == TaskStatus.RUNNING

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            AIAgentTaskUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = AIAgentTaskUpdate(status=TaskStatus.COMPLETED)
        result = update.to_update_dict()
        assert result == {"status": "completed"}
        assert "output" not in result
        assert "error" not in result

    def test_error_field(self) -> None:
        update = AIAgentTaskUpdate(
            status=TaskStatus.FAILED,
            error="Connection timeout",
        )
        result = update.to_update_dict()
        assert result["status"] == "failed"
        assert result["error"] == "Connection timeout"

    def test_output_field(self) -> None:
        update = AIAgentTaskUpdate(
            output={"insights_generated": 3}
        )
        result = update.to_update_dict()
        assert result["output"] == {"insights_generated": 3}

    def test_attempts_negative_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskUpdate(attempts=-1)

    def test_invalid_status_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIAgentTaskUpdate(status="invalid")


class TestAIAgentTaskResponse:
    def test_from_row(self) -> None:
        row = make_ai_task_row(
            task_type="generate_insight",
            status="pending",
            priority=3,
            attempts=1,
            max_attempts=3,
        )
        response = AIAgentTaskResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.task_type == "generate_insight"
        assert response.status == "pending"
        assert response.priority == 3
        assert response.attempts == 1
        assert response.max_attempts == 3
        assert response.input == {}
        assert response.created_at == row.created_at

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_task_row()
        response = AIAgentTaskResponse.from_row(row)
        assert response.output is None
        assert response.error is None
        assert response.session_id is None
        assert response.started_at is None
        assert response.completed_at is None
