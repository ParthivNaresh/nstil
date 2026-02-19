from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})
POSITIVE = frozenset({"happy", "calm", "neutral"})
DIFFICULT = frozenset({"sad", "anxious", "angry"})

REFLECTION_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="rf-001",
        prompt_type="reflection",
        content="Looking back at what you wrote, what stands out to you most?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.REFLECTION}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="rf-002",
        prompt_type="reflection",
        content="How does writing this down make you feel compared to before?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.EMOTIONS, PromptTag.REFLECTION}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="rf-003",
        prompt_type="reflection",
        content="What would you tell a friend who was feeling this way?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.RELATIONSHIPS}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="rf-004",
        prompt_type="reflection",
        content="Is there a pattern here you've noticed before?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.REFLECTION, PromptTag.GROWTH}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="rf-005",
        prompt_type="reflection",
        content="What's one thing you can take away from this experience?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.REFLECTION}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="rf-006",
        prompt_type="reflection",
        content="It sounds like you're carrying a lot. What's one thing you can let go of?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.SELF_CARE}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="rf-007",
        prompt_type="reflection",
        content="What strength did you show today, even if it felt small?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.GROWTH}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="rf-008",
        prompt_type="reflection",
        content="That sounds like a meaningful moment. What made it special?",
        mood_categories=POSITIVE,
        tags=frozenset({PromptTag.JOY, PromptTag.GRATITUDE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="rf-009",
        prompt_type="reflection",
        content="How has your perspective on this changed over time?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GROWTH, PromptTag.CHANGE}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="rf-010",
        prompt_type="reflection",
        content="What would tomorrow look like if things went well?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.FUTURE, PromptTag.GOALS}),
        intensity=PromptIntensity.LIGHT,
    ),
)
