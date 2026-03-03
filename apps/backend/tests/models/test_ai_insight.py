import uuid
from datetime import date

import pytest
from pydantic import ValidationError

from nstil.models.ai_insight import (
    MAX_INSIGHT_CONTENT_LENGTH,
    MAX_INSIGHT_TITLE_LENGTH,
    AIInsightCreate,
    AIInsightResponse,
    AIInsightUpdate,
    InsightSource,
    InsightStatus,
    InsightType,
)
from tests.factories import make_ai_insight_row


class TestAIInsightCreate:
    def test_minimal(self) -> None:
        insight = AIInsightCreate(
            insight_type=InsightType.WEEKLY_SUMMARY,
            title="Week of Jan 6",
            content="You wrote 5 entries.",
        )
        assert insight.insight_type == InsightType.WEEKLY_SUMMARY
        assert insight.title == "Week of Jan 6"
        assert insight.content == "You wrote 5 entries."
        assert insight.source == InsightSource.COMPUTED
        assert insight.supporting_entry_ids == []
        assert insight.confidence is None
        assert insight.period_start is None
        assert insight.period_end is None
        assert insight.metadata == {}

    def test_all_fields(self) -> None:
        eid = uuid.uuid4()
        sid = uuid.uuid4()
        insight = AIInsightCreate(
            insight_type=InsightType.ANOMALY,
            title="Mood shift",
            content="Your mood has been lower.",
            supporting_entry_ids=[eid],
            source=InsightSource.ON_DEVICE_LLM,
            model_id="foundation-3b",
            confidence=0.85,
            period_start=date(2025, 1, 6),
            period_end=date(2025, 1, 12),
            session_id=sid,
            metadata={"direction": "negative"},
        )
        assert insight.confidence == 0.85
        assert insight.period_start == date(2025, 1, 6)
        assert insight.period_end == date(2025, 1, 12)
        assert insight.supporting_entry_ids == [eid]

    def test_title_stripped(self) -> None:
        insight = AIInsightCreate(
            insight_type=InsightType.STREAK_MILESTONE,
            title="  7-day streak!  ",
            content="Keep it up!",
        )
        assert insight.title == "7-day streak!"

    def test_content_stripped(self) -> None:
        insight = AIInsightCreate(
            insight_type=InsightType.STREAK_MILESTONE,
            title="Streak",
            content="  You did it!  ",
        )
        assert insight.content == "You did it!"

    def test_empty_title_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="",
                content="test",
            )

    def test_whitespace_only_title_rejected(self) -> None:
        with pytest.raises(ValidationError, match="blank"):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="   ",
                content="test",
            )

    def test_empty_content_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="",
            )

    def test_whitespace_only_content_rejected(self) -> None:
        with pytest.raises(ValidationError, match="blank"):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="   ",
            )

    def test_title_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="x" * (MAX_INSIGHT_TITLE_LENGTH + 1),
                content="test",
            )

    def test_content_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="x" * (MAX_INSIGHT_CONTENT_LENGTH + 1),
            )

    def test_period_start_after_end_rejected(self) -> None:
        with pytest.raises(ValidationError, match="period_start must be before"):
            AIInsightCreate(
                insight_type=InsightType.WEEKLY_SUMMARY,
                title="test",
                content="test",
                period_start=date(2025, 1, 12),
                period_end=date(2025, 1, 6),
            )

    def test_period_start_equals_end_accepted(self) -> None:
        insight = AIInsightCreate(
            insight_type=InsightType.STREAK_MILESTONE,
            title="test",
            content="test",
            period_start=date(2025, 1, 6),
            period_end=date(2025, 1, 6),
        )
        assert insight.period_start == insight.period_end

    def test_confidence_below_zero_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="test",
                confidence=-0.1,
            )

    def test_confidence_above_one_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="test",
                confidence=1.1,
            )

    def test_confidence_boundary_values_accepted(self) -> None:
        for conf in [0.0, 0.5, 1.0]:
            insight = AIInsightCreate(
                insight_type=InsightType.PATTERN,
                title="test",
                content="test",
                confidence=conf,
            )
            assert insight.confidence == conf

    def test_invalid_insight_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightCreate(
                insight_type="invalid",
                title="test",
                content="test",
            )

    def test_all_insight_types_accepted(self) -> None:
        for it in InsightType:
            insight = AIInsightCreate(insight_type=it, title="test", content="test")
            assert insight.insight_type == it


class TestAIInsightUpdate:
    def test_single_field(self) -> None:
        update = AIInsightUpdate(status=InsightStatus.SEEN)
        assert update.status == InsightStatus.SEEN

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            AIInsightUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = AIInsightUpdate(status=InsightStatus.BOOKMARKED)
        result = update.to_update_dict()
        assert result == {"status": "bookmarked"}
        assert "superseded_by" not in result
        assert "metadata" not in result

    def test_superseded_by(self) -> None:
        new_id = uuid.uuid4()
        update = AIInsightUpdate(superseded_by=new_id)
        result = update.to_update_dict()
        assert result["superseded_by"] == str(new_id)

    def test_metadata_update(self) -> None:
        update = AIInsightUpdate(metadata={"reviewed": True})
        result = update.to_update_dict()
        assert result["metadata"] == {"reviewed": True}

    def test_invalid_status_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIInsightUpdate(status="invalid")


class TestAIInsightResponse:
    def test_from_row(self) -> None:
        row = make_ai_insight_row(
            insight_type="weekly_summary",
            title="Week of Jan 6",
            content="5 entries",
            source="computed",
            confidence=1.0,
            status="generated",
        )
        response = AIInsightResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.insight_type == "weekly_summary"
        assert response.title == "Week of Jan 6"
        assert response.content == "5 entries"
        assert response.source == "computed"
        assert response.confidence == 1.0
        assert response.status == "generated"
        assert response.created_at == row.created_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_ai_insight_row()
        response = AIInsightResponse.from_row(row)
        assert not hasattr(response, "deleted_at")

    def test_from_row_with_period(self) -> None:
        row = make_ai_insight_row(
            period_start=date(2025, 1, 6),
            period_end=date(2025, 1, 12),
        )
        response = AIInsightResponse.from_row(row)
        assert response.period_start == date(2025, 1, 6)
        assert response.period_end == date(2025, 1, 12)

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_insight_row()
        response = AIInsightResponse.from_row(row)
        assert response.model_id is None
        assert response.period_start is None
        assert response.period_end is None
        assert response.session_id is None
        assert response.superseded_by is None
        assert response.expires_at is None
