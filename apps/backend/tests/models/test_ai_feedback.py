import uuid

import pytest
from pydantic import ValidationError

from nstil.models.ai_feedback import (
    MAX_FEEDBACK_REASON_LENGTH,
    AIFeedbackCreate,
    AIFeedbackResponse,
    FeedbackTargetType,
)
from tests.factories import make_ai_feedback_row


class TestAIFeedbackCreate:
    def test_minimal(self) -> None:
        tid = uuid.uuid4()
        feedback = AIFeedbackCreate(
            target_type=FeedbackTargetType.PROMPT,
            target_id=tid,
            rating=1,
        )
        assert feedback.target_type == FeedbackTargetType.PROMPT
        assert feedback.target_id == tid
        assert feedback.rating == 1
        assert feedback.reason is None
        assert feedback.metadata == {}

    def test_with_reason(self) -> None:
        feedback = AIFeedbackCreate(
            target_type=FeedbackTargetType.INSIGHT,
            target_id=uuid.uuid4(),
            rating=-1,
            reason="Not helpful",
        )
        assert feedback.reason == "Not helpful"

    def test_reason_stripped(self) -> None:
        feedback = AIFeedbackCreate(
            target_type=FeedbackTargetType.PROMPT,
            target_id=uuid.uuid4(),
            rating=1,
            reason="  Great prompt  ",
        )
        assert feedback.reason == "Great prompt"

    def test_whitespace_only_reason_becomes_none(self) -> None:
        feedback = AIFeedbackCreate(
            target_type=FeedbackTargetType.PROMPT,
            target_id=uuid.uuid4(),
            rating=1,
            reason="   ",
        )
        assert feedback.reason is None

    def test_reason_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIFeedbackCreate(
                target_type=FeedbackTargetType.PROMPT,
                target_id=uuid.uuid4(),
                rating=1,
                reason="x" * (MAX_FEEDBACK_REASON_LENGTH + 1),
            )

    def test_rating_boundary_values(self) -> None:
        for rating in [-1, 0, 1]:
            feedback = AIFeedbackCreate(
                target_type=FeedbackTargetType.PROMPT,
                target_id=uuid.uuid4(),
                rating=rating,
            )
            assert feedback.rating == rating

    def test_rating_too_low_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIFeedbackCreate(
                target_type=FeedbackTargetType.PROMPT,
                target_id=uuid.uuid4(),
                rating=-2,
            )

    def test_rating_too_high_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIFeedbackCreate(
                target_type=FeedbackTargetType.PROMPT,
                target_id=uuid.uuid4(),
                rating=2,
            )

    def test_invalid_target_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AIFeedbackCreate(
                target_type="invalid",
                target_id=uuid.uuid4(),
                rating=1,
            )

    def test_all_target_types_accepted(self) -> None:
        for tt in FeedbackTargetType:
            feedback = AIFeedbackCreate(
                target_type=tt,
                target_id=uuid.uuid4(),
                rating=0,
            )
            assert feedback.target_type == tt


class TestAIFeedbackResponse:
    def test_from_row(self) -> None:
        row = make_ai_feedback_row(
            target_type="insight",
            rating=-1,
            reason="Not relevant",
        )
        response = AIFeedbackResponse.from_row(row)
        assert response.id == row.id
        assert response.target_type == "insight"
        assert response.target_id == row.target_id
        assert response.rating == -1
        assert response.reason == "Not relevant"
        assert response.created_at == row.created_at

    def test_from_row_excludes_user_id(self) -> None:
        row = make_ai_feedback_row()
        response = AIFeedbackResponse.from_row(row)
        assert not hasattr(response, "user_id")

    def test_from_row_nullable_reason(self) -> None:
        row = make_ai_feedback_row(reason=None)
        response = AIFeedbackResponse.from_row(row)
        assert response.reason is None
