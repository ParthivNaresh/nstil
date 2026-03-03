import pytest
from pydantic import ValidationError

from nstil.models.breathing import (
    MAX_DURATION_SECONDS,
    BreathingPattern,
    BreathingSessionCreate,
    BreathingSessionResponse,
    BreathingSessionRow,
    BreathingSessionUpdate,
    BreathingStatsResponse,
)
from tests.factories import make_breathing_session_row


class TestBreathingPattern:
    def test_values(self) -> None:
        assert BreathingPattern.BOX == "box"
        assert BreathingPattern.FOUR_SEVEN_EIGHT == "478"
        assert BreathingPattern.CALM == "calm"

    def test_from_string(self) -> None:
        assert BreathingPattern("box") == BreathingPattern.BOX
        assert BreathingPattern("478") == BreathingPattern.FOUR_SEVEN_EIGHT
        assert BreathingPattern("calm") == BreathingPattern.CALM

    def test_invalid_pattern_raises(self) -> None:
        with pytest.raises(ValueError):
            BreathingPattern("invalid")


class TestBreathingSessionCreate:
    def test_valid_minimal(self) -> None:
        data = BreathingSessionCreate(
            pattern=BreathingPattern.BOX,
            duration_seconds=120,
            cycles_target=4,
        )
        assert data.pattern == BreathingPattern.BOX
        assert data.duration_seconds == 120
        assert data.cycles_target == 4
        assert data.mood_before is None

    def test_valid_with_mood(self) -> None:
        data = BreathingSessionCreate(
            pattern=BreathingPattern.FOUR_SEVEN_EIGHT,
            duration_seconds=60,
            cycles_target=3,
            mood_before="anxious",
        )
        assert data.mood_before is not None
        assert data.mood_before.value == "anxious"

    def test_duration_zero_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionCreate(
                pattern=BreathingPattern.BOX,
                duration_seconds=0,
                cycles_target=4,
            )

    def test_duration_negative_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionCreate(
                pattern=BreathingPattern.BOX,
                duration_seconds=-1,
                cycles_target=4,
            )

    def test_duration_exceeds_max_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionCreate(
                pattern=BreathingPattern.BOX,
                duration_seconds=MAX_DURATION_SECONDS + 1,
                cycles_target=4,
            )

    def test_duration_at_max_accepted(self) -> None:
        data = BreathingSessionCreate(
            pattern=BreathingPattern.BOX,
            duration_seconds=MAX_DURATION_SECONDS,
            cycles_target=4,
        )
        assert data.duration_seconds == MAX_DURATION_SECONDS

    def test_cycles_target_zero_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionCreate(
                pattern=BreathingPattern.BOX,
                duration_seconds=120,
                cycles_target=0,
            )

    def test_invalid_mood_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionCreate(
                pattern=BreathingPattern.BOX,
                duration_seconds=120,
                cycles_target=4,
                mood_before="invalid_mood",
            )


class TestBreathingSessionUpdate:
    def test_valid_completed(self) -> None:
        data = BreathingSessionUpdate(
            cycles_completed=4,
            mood_after="calm",
            completed=True,
        )
        assert data.cycles_completed == 4
        assert data.completed is True

    def test_partial_update(self) -> None:
        data = BreathingSessionUpdate(completed=True)
        assert data.completed is True
        assert data.cycles_completed is None
        assert data.mood_after is None

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            BreathingSessionUpdate()

    def test_negative_cycles_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionUpdate(cycles_completed=-1)

    def test_invalid_mood_after_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BreathingSessionUpdate(mood_after="invalid_mood")

    def test_to_update_dict(self) -> None:
        data = BreathingSessionUpdate(cycles_completed=4, completed=True)
        result = data.to_update_dict()
        assert result == {"cycles_completed": 4, "completed": True}

    def test_to_update_dict_excludes_none(self) -> None:
        data = BreathingSessionUpdate(completed=True)
        result = data.to_update_dict()
        assert result == {"completed": True}
        assert "cycles_completed" not in result
        assert "mood_after" not in result

    def test_to_update_dict_mood_serialized(self) -> None:
        data = BreathingSessionUpdate(mood_after="calm")
        result = data.to_update_dict()
        assert result == {"mood_after": "calm"}


class TestBreathingSessionResponse:
    def test_from_row(self) -> None:
        row = make_breathing_session_row(
            pattern="478",
            duration_seconds=240,
            cycles_completed=3,
            cycles_target=5,
            mood_before="anxious",
            completed=False,
        )
        response = BreathingSessionResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.pattern == "478"
        assert response.duration_seconds == 240
        assert response.cycles_completed == 3
        assert response.cycles_target == 5
        assert response.mood_before == "anxious"
        assert response.mood_after is None
        assert response.completed is False
        assert response.created_at == row.created_at

    def test_from_row_completed_with_mood(self) -> None:
        row = make_breathing_session_row(
            pattern="calm",
            completed=True,
            mood_before="anxious",
            mood_after="calm",
            cycles_completed=4,
            cycles_target=4,
        )
        response = BreathingSessionResponse.from_row(row)
        assert response.completed is True
        assert response.mood_before == "anxious"
        assert response.mood_after == "calm"

    def test_from_row_nullable_fields(self) -> None:
        row = make_breathing_session_row()
        response = BreathingSessionResponse.from_row(row)
        assert response.mood_before is None
        assert response.mood_after is None


class TestBreathingSessionRow:
    def test_extra_fields_ignored(self) -> None:
        row = make_breathing_session_row()
        data = row.model_dump()
        data["unknown_field"] = "should be ignored"
        parsed = BreathingSessionRow.model_validate(data)
        assert not hasattr(parsed, "unknown_field")


class TestBreathingStatsResponse:
    def test_construction(self) -> None:
        stats = BreathingStatsResponse(
            total_sessions=10,
            completed_sessions=8,
            total_minutes=45,
            sessions_this_week=3,
        )
        assert stats.total_sessions == 10
        assert stats.completed_sessions == 8
        assert stats.total_minutes == 45
        assert stats.sessions_this_week == 3
