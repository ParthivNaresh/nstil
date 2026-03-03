import pytest
from pydantic import ValidationError

from nstil.models.ai_profile import (
    MAX_GOALS_COUNT,
    MAX_TOPIC_LENGTH,
    MAX_TOPICS_COUNT,
    PromptStyle,
    UserAIProfileResponse,
    UserAIProfileUpdate,
)
from tests.factories import make_ai_profile_row


class TestUserAIProfileUpdate:
    def test_single_field(self) -> None:
        update = UserAIProfileUpdate(prompt_style=PromptStyle.DIRECT)
        assert update.prompt_style == PromptStyle.DIRECT

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            UserAIProfileUpdate()

    def test_ai_enabled_toggle(self) -> None:
        update = UserAIProfileUpdate(ai_enabled=False)
        assert update.ai_enabled is False

    def test_to_update_dict_excludes_none(self) -> None:
        update = UserAIProfileUpdate(prompt_style=PromptStyle.ANALYTICAL)
        result = update.to_update_dict()
        assert result == {"prompt_style": "analytical"}
        assert "ai_enabled" not in result
        assert "topics_to_avoid" not in result

    def test_invalid_prompt_style_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UserAIProfileUpdate(prompt_style="poetic")

    def test_all_prompt_styles_accepted(self) -> None:
        for style in PromptStyle:
            update = UserAIProfileUpdate(prompt_style=style)
            assert update.prompt_style == style

    def test_topics_stripped(self) -> None:
        update = UserAIProfileUpdate(topics_to_avoid=["  work  ", "  family  "])
        assert update.topics_to_avoid == ["work", "family"]

    def test_topics_empty_strings_removed(self) -> None:
        update = UserAIProfileUpdate(topics_to_avoid=["work", "", "  ", "health"])
        assert update.topics_to_avoid == ["work", "health"]

    def test_topics_too_many_rejected(self) -> None:
        with pytest.raises(ValidationError, match=f"Maximum {MAX_TOPICS_COUNT}"):
            UserAIProfileUpdate(topics_to_avoid=[f"topic{i}" for i in range(MAX_TOPICS_COUNT + 1)])

    def test_topic_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError, match=f"at most {MAX_TOPIC_LENGTH}"):
            UserAIProfileUpdate(topics_to_avoid=["x" * (MAX_TOPIC_LENGTH + 1)])

    def test_topics_empty_list_accepted(self) -> None:
        update = UserAIProfileUpdate(topics_to_avoid=[])
        assert update.topics_to_avoid == []

    def test_goals_accepted(self) -> None:
        goals = [{"title": "Journal daily", "target": 30}]
        update = UserAIProfileUpdate(goals=goals)
        assert update.goals == goals

    def test_goals_too_many_rejected(self) -> None:
        with pytest.raises(ValidationError, match=f"Maximum {MAX_GOALS_COUNT}"):
            UserAIProfileUpdate(goals=[{"title": f"goal{i}"} for i in range(MAX_GOALS_COUNT + 1)])

    def test_goals_empty_list_accepted(self) -> None:
        update = UserAIProfileUpdate(goals=[])
        assert update.goals == []

    def test_multiple_fields(self) -> None:
        update = UserAIProfileUpdate(
            ai_enabled=True,
            prompt_style=PromptStyle.MOTIVATIONAL,
            topics_to_avoid=["politics"],
        )
        result = update.to_update_dict()
        assert result["ai_enabled"] is True
        assert result["prompt_style"] == "motivational"
        assert result["topics_to_avoid"] == ["politics"]


class TestUserAIProfileResponse:
    def test_from_row(self) -> None:
        row = make_ai_profile_row(
            prompt_style="direct",
            topics_to_avoid=["work"],
            goals=[{"title": "Be consistent"}],
        )
        response = UserAIProfileResponse.from_row(row)
        assert response.user_id == row.user_id
        assert response.ai_enabled is True
        assert response.prompt_style == "direct"
        assert response.topics_to_avoid == ["work"]
        assert response.goals == [{"title": "Be consistent"}]
        assert response.updated_at == row.updated_at

    def test_from_row_excludes_created_at(self) -> None:
        row = make_ai_profile_row()
        response = UserAIProfileResponse.from_row(row)
        assert not hasattr(response, "created_at")

    def test_from_row_nullable_fields(self) -> None:
        row = make_ai_profile_row()
        response = UserAIProfileResponse.from_row(row)
        assert response.last_check_in_at is None
