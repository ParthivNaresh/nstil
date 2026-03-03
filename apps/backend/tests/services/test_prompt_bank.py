from nstil.services.ai.prompt_bank import PromptBank
from nstil.services.ai.prompt_bank.affirmation import AFFIRMATION_PROMPTS
from nstil.services.ai.prompt_bank.check_in import CHECK_IN_PROMPTS
from nstil.services.ai.prompt_bank.goal_check import GOAL_CHECK_PROMPTS
from nstil.services.ai.prompt_bank.guided import GUIDED_PROMPTS
from nstil.services.ai.prompt_bank.nudge import NUDGE_PROMPTS
from nstil.services.ai.prompt_bank.reflection import REFLECTION_PROMPTS
from nstil.services.ai.prompt_bank.reframe import REFRAME_PROMPTS
from nstil.services.ai.prompt_bank.types import PromptIntensity, PromptTag

ALL_DATA_FILES = (
    CHECK_IN_PROMPTS,
    REFLECTION_PROMPTS,
    NUDGE_PROMPTS,
    AFFIRMATION_PROMPTS,
    REFRAME_PROMPTS,
    GUIDED_PROMPTS,
    GOAL_CHECK_PROMPTS,
)


class TestPromptBankIntegrity:
    def test_no_duplicate_ids(self) -> None:
        all_ids: list[str] = []
        for prompts in ALL_DATA_FILES:
            for p in prompts:
                all_ids.append(p.id)
        assert len(all_ids) == len(set(all_ids))

    def test_total_count(self) -> None:
        expected = sum(len(p) for p in ALL_DATA_FILES)
        assert PromptBank.count() == expected
        assert PromptBank.count() == 76

    def test_all_prompts_have_content(self) -> None:
        for prompts in ALL_DATA_FILES:
            for p in prompts:
                assert p.content.strip(), f"Prompt {p.id} has empty content"

    def test_all_prompts_have_mood_categories(self) -> None:
        for prompts in ALL_DATA_FILES:
            for p in prompts:
                assert len(p.mood_categories) > 0, f"Prompt {p.id} has no mood categories"


class TestGetById:
    def test_valid_id(self) -> None:
        first = CHECK_IN_PROMPTS[0]
        result = PromptBank.get_by_id(first.id)
        assert result is not None
        assert result.id == first.id
        assert result.content == first.content

    def test_invalid_id_returns_none(self) -> None:
        assert PromptBank.get_by_id("nonexistent-id") is None


class TestGetByType:
    def test_returns_correct_type(self) -> None:
        results = PromptBank.get_by_type("check_in")
        assert len(results) > 0
        for p in results:
            assert p.prompt_type == "check_in"

    def test_unknown_type_returns_empty(self) -> None:
        assert PromptBank.get_by_type("nonexistent") == []

    def test_mood_filter(self) -> None:
        results = PromptBank.get_by_type("check_in", mood_category="sad")
        assert len(results) > 0
        for p in results:
            assert "sad" in p.mood_categories or "neutral" in p.mood_categories


class TestCountByType:
    def test_check_in_count(self) -> None:
        assert PromptBank.count_by_type("check_in") == len(CHECK_IN_PROMPTS)

    def test_reflection_count(self) -> None:
        assert PromptBank.count_by_type("reflection") == len(REFLECTION_PROMPTS)

    def test_unknown_type_returns_zero(self) -> None:
        assert PromptBank.count_by_type("nonexistent") == 0


class TestGetFiltered:
    def test_exclude_ids(self) -> None:
        all_check_in = PromptBank.get_by_type("check_in")
        exclude = frozenset({all_check_in[0].id})
        filtered = PromptBank.get_filtered("check_in", exclude_ids=exclude)
        assert len(filtered) == len(all_check_in) - 1
        assert all(p.id not in exclude for p in filtered)

    def test_exclude_topics(self) -> None:
        exclude = frozenset({PromptTag.RELATIONSHIPS})
        filtered = PromptBank.get_filtered("check_in", exclude_topics=exclude)
        for p in filtered:
            assert PromptTag.RELATIONSHIPS not in p.tags

    def test_max_intensity_light(self) -> None:
        filtered = PromptBank.get_filtered("check_in", max_intensity=PromptIntensity.LIGHT)
        for p in filtered:
            assert p.intensity == PromptIntensity.LIGHT

    def test_max_intensity_moderate(self) -> None:
        filtered = PromptBank.get_filtered("check_in", max_intensity=PromptIntensity.MODERATE)
        for p in filtered:
            assert p.intensity in (PromptIntensity.LIGHT, PromptIntensity.MODERATE)

    def test_max_intensity_deep_includes_all(self) -> None:
        all_check_in = PromptBank.get_by_type("check_in")
        filtered = PromptBank.get_filtered("check_in", max_intensity=PromptIntensity.DEEP)
        assert len(filtered) == len(all_check_in)


class TestGetRandom:
    def test_returns_prompt(self) -> None:
        result = PromptBank.get_random("check_in")
        assert result is not None
        assert result.prompt_type == "check_in"

    def test_empty_result_returns_none(self) -> None:
        all_ids = frozenset(p.id for p in PromptBank.get_by_type("check_in"))
        result = PromptBank.get_random("check_in", exclude_ids=all_ids)
        assert result is None

    def test_unknown_type_returns_none(self) -> None:
        assert PromptBank.get_random("nonexistent") is None

    def test_with_mood_filter(self) -> None:
        result = PromptBank.get_random("check_in", mood_category="happy")
        assert result is not None
        assert "happy" in result.mood_categories or "neutral" in result.mood_categories


class TestAvailableTypes:
    def test_returns_all_types(self) -> None:
        types = PromptBank.available_types()
        assert "check_in" in types
        assert "reflection" in types
        assert "nudge" in types
        assert "affirmation" in types
        assert "reframe" in types
        assert "guided" in types
        assert "goal_check" in types
        assert len(types) == 7

    def test_sorted(self) -> None:
        types = PromptBank.available_types()
        assert types == sorted(types)
