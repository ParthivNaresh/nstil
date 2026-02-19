from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})
POSITIVE = frozenset({"happy", "calm", "neutral"})
DIFFICULT = frozenset({"sad", "anxious", "angry"})

GUIDED_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="gu-001",
        prompt_type="guided",
        content="Write about three things you're grateful for today and why they matter to you.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GRATITUDE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gu-002",
        prompt_type="guided",
        content="Describe a moment today when you felt most like yourself.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.IDENTITY, PromptTag.REFLECTION}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-003",
        prompt_type="guided",
        content="Write a letter to your future self. What do you want them to know?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.FUTURE, PromptTag.GROWTH}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gu-004",
        prompt_type="guided",
        content=(
            "What's a relationship in your life that you'd like to nurture?"
            " What's one step you could take?"
        ),
        mood_categories=ALL,
        tags=frozenset({PromptTag.RELATIONSHIPS, PromptTag.GOALS}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-005",
        prompt_type="guided",
        content="Describe your ideal morning. How does it compare to your current routine?",
        mood_categories=POSITIVE,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.GOALS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gu-006",
        prompt_type="guided",
        content="What's something you've been putting off? What's really holding you back?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.REFLECTION}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gu-007",
        prompt_type="guided",
        content="Write about a time you surprised yourself with your own strength.",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.GROWTH}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-008",
        prompt_type="guided",
        content="What does rest look like for you? When was the last time you truly rested?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.HEALTH}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-009",
        prompt_type="guided",
        content="Think about something creative you'd like to try. What draws you to it?",
        mood_categories=POSITIVE,
        tags=frozenset({PromptTag.CREATIVITY, PromptTag.JOY}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gu-010",
        prompt_type="guided",
        content="What value is most important to you right now? How are you living it?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.VALUES, PromptTag.IDENTITY}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gu-011",
        prompt_type="guided",
        content="Describe a place where you feel completely at peace. What makes it special?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.MINDFULNESS, PromptTag.SELF_CARE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="gu-012",
        prompt_type="guided",
        content="What's a lesson you learned the hard way that you're now grateful for?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.GRATITUDE}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="gu-013",
        prompt_type="guided",
        content=(
            "Write about someone who has positively influenced your life."
            " What did they teach you?"
        ),
        mood_categories=ALL,
        tags=frozenset({PromptTag.RELATIONSHIPS, PromptTag.GRATITUDE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-014",
        prompt_type="guided",
        content="What's a change you've been through recently? How are you adapting?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.CHANGE, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="gu-015",
        prompt_type="guided",
        content="If you had no fear, what would you do differently?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.FUTURE}),
        intensity=PromptIntensity.DEEP,
    ),
)
