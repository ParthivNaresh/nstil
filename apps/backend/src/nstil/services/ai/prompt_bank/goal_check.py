from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})

GOAL_CHECK_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="gc-001",
        prompt_type="goal_check",
        content="How are you progressing toward your goals? What's working?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.REFLECTION}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gc-002",
        prompt_type="goal_check",
        content="What's one small step you took this week toward something that matters to you?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.GROWTH}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gc-003",
        prompt_type="goal_check",
        content=(
            "Are your current goals still aligned with what you want?"
            " It's okay if they've shifted."
        ),
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.VALUES}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gc-004",
        prompt_type="goal_check",
        content="What obstacle has been getting in the way? How might you work around it?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gc-005",
        prompt_type="goal_check",
        content="What would it feel like to achieve what you're working toward?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.FUTURE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gc-006",
        prompt_type="goal_check",
        content="What's one habit that's been helping you move forward?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.GROWTH}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gc-007",
        prompt_type="goal_check",
        content=(
            "Is there a goal you've outgrown?"
            " It's okay to let it go and make room for something new."
        ),
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.CHANGE}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gc-008",
        prompt_type="goal_check",
        content=(
            "Who or what has been supporting you in your goals?"
            " Take a moment to appreciate that."
        ),
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.GRATITUDE}),
        intensity=PromptIntensity.LIGHT,
    ),
)
