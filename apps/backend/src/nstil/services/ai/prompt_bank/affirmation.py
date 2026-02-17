from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})
POSITIVE = frozenset({"happy", "calm", "neutral"})
DIFFICULT = frozenset({"sad", "anxious", "angry"})

AFFIRMATION_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="af-001",
        prompt_type="affirmation",
        content="You showed up today, and that matters.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.RESILIENCE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-002",
        prompt_type="affirmation",
        content="It's okay to not have everything figured out.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-003",
        prompt_type="affirmation",
        content="Your feelings are valid, even the uncomfortable ones.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.EMOTIONS, PromptTag.SELF_CARE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-004",
        prompt_type="affirmation",
        content="Progress isn't always visible. Trust the process.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-005",
        prompt_type="affirmation",
        content="You deserve the same kindness you give to others.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.RELATIONSHIPS}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="af-006",
        prompt_type="affirmation",
        content="This moment of reflection is a gift to yourself.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.MINDFULNESS, PromptTag.SELF_CARE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-007",
        prompt_type="affirmation",
        content="You're building something meaningful by showing up here.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.GOALS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-008",
        prompt_type="affirmation",
        content="Difficult days don't define you. They refine you.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.GROWTH}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="af-009",
        prompt_type="affirmation",
        content="You're allowed to take things one step at a time.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="af-010",
        prompt_type="affirmation",
        content="The fact that you're reflecting shows real self-awareness.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.REFLECTION}),
        intensity=PromptIntensity.LIGHT,
    ),
)
