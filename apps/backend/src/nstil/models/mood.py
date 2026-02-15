from enum import StrEnum


class MoodCategory(StrEnum):
    HAPPY = "happy"
    CALM = "calm"
    SAD = "sad"
    ANXIOUS = "anxious"
    ANGRY = "angry"


class MoodSpecific(StrEnum):
    JOYFUL = "joyful"
    GRATEFUL = "grateful"
    EXCITED = "excited"
    PROUD = "proud"

    PEACEFUL = "peaceful"
    CONTENT = "content"
    RELAXED = "relaxed"
    HOPEFUL = "hopeful"

    DOWN = "down"
    LONELY = "lonely"
    DISAPPOINTED = "disappointed"
    NOSTALGIC = "nostalgic"

    STRESSED = "stressed"
    WORRIED = "worried"
    OVERWHELMED = "overwhelmed"
    RESTLESS = "restless"

    FRUSTRATED = "frustrated"
    IRRITATED = "irritated"
    HURT = "hurt"
    RESENTFUL = "resentful"


MOOD_CATEGORY_SPECIFICS: dict[MoodCategory, frozenset[MoodSpecific]] = {
    MoodCategory.HAPPY: frozenset({
        MoodSpecific.JOYFUL,
        MoodSpecific.GRATEFUL,
        MoodSpecific.EXCITED,
        MoodSpecific.PROUD,
    }),
    MoodCategory.CALM: frozenset({
        MoodSpecific.PEACEFUL,
        MoodSpecific.CONTENT,
        MoodSpecific.RELAXED,
        MoodSpecific.HOPEFUL,
    }),
    MoodCategory.SAD: frozenset({
        MoodSpecific.DOWN,
        MoodSpecific.LONELY,
        MoodSpecific.DISAPPOINTED,
        MoodSpecific.NOSTALGIC,
    }),
    MoodCategory.ANXIOUS: frozenset({
        MoodSpecific.STRESSED,
        MoodSpecific.WORRIED,
        MoodSpecific.OVERWHELMED,
        MoodSpecific.RESTLESS,
    }),
    MoodCategory.ANGRY: frozenset({
        MoodSpecific.FRUSTRATED,
        MoodSpecific.IRRITATED,
        MoodSpecific.HURT,
        MoodSpecific.RESENTFUL,
    }),
}


def validate_mood_pair(
    category: MoodCategory | None,
    specific: MoodSpecific | None,
) -> None:
    if specific is not None and category is None:
        msg = "mood_specific requires mood_category"
        raise ValueError(msg)
    if specific is not None and category is not None:
        valid = MOOD_CATEGORY_SPECIFICS.get(category, frozenset())
        if specific not in valid:
            msg = f"'{specific}' is not valid for category '{category}'"
            raise ValueError(msg)
