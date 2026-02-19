import pytest

from nstil.models.mood import (
    MOOD_CATEGORY_SPECIFICS,
    MoodCategory,
    MoodSpecific,
    validate_mood_pair,
)


class TestMoodEnums:
    def test_all_categories(self) -> None:
        assert set(MoodCategory) == {"happy", "calm", "sad", "anxious", "angry"}

    def test_all_specifics_count(self) -> None:
        assert len(MoodSpecific) == 20

    def test_each_category_has_four_specifics(self) -> None:
        for category, specifics in MOOD_CATEGORY_SPECIFICS.items():
            assert len(specifics) == 4, f"{category} has {len(specifics)} specifics"

    def test_all_specifics_assigned(self) -> None:
        all_assigned = set()
        for specifics in MOOD_CATEGORY_SPECIFICS.values():
            all_assigned.update(specifics)
        assert all_assigned == set(MoodSpecific)

    def test_no_overlapping_specifics(self) -> None:
        seen: set[MoodSpecific] = set()
        for specifics in MOOD_CATEGORY_SPECIFICS.values():
            overlap = seen & specifics
            assert not overlap, f"Overlapping specifics: {overlap}"
            seen.update(specifics)


class TestValidateMoodPair:
    def test_both_none(self) -> None:
        validate_mood_pair(None, None)

    def test_category_only(self) -> None:
        validate_mood_pair(MoodCategory.HAPPY, None)

    def test_valid_pair(self) -> None:
        validate_mood_pair(MoodCategory.HAPPY, MoodSpecific.GRATEFUL)

    def test_all_valid_pairs(self) -> None:
        for category, specifics in MOOD_CATEGORY_SPECIFICS.items():
            for specific in specifics:
                validate_mood_pair(category, specific)

    def test_specific_without_category_rejected(self) -> None:
        with pytest.raises(ValueError, match="mood_specific requires mood_category"):
            validate_mood_pair(None, MoodSpecific.GRATEFUL)

    def test_wrong_category_rejected(self) -> None:
        with pytest.raises(ValueError, match="not valid for category"):
            validate_mood_pair(MoodCategory.HAPPY, MoodSpecific.STRESSED)

    def test_cross_category_rejected(self) -> None:
        with pytest.raises(ValueError, match="not valid for category"):
            validate_mood_pair(MoodCategory.ANGRY, MoodSpecific.PEACEFUL)
