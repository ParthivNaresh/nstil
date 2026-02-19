from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})

NUDGE_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="nu-001",
        prompt_type="nudge",
        content="It's been a while since you last wrote. Even a few words can help.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.SELF_CARE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-002",
        prompt_type="nudge",
        content="Your journal is here whenever you're ready. No pressure.",
        mood_categories=ALL,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.MINDFULNESS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-003",
        prompt_type="nudge",
        content="A quick check-in can go a long way. How are you doing?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.EMOTIONS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-004",
        prompt_type="nudge",
        content="Sometimes the hardest part is starting. What's one sentence about your day?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.REFLECTION}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-005",
        prompt_type="nudge",
        content="You've been consistent lately. Keep the momentum going?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.GROWTH}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-006",
        prompt_type="nudge",
        content="What's one thing you noticed today that you usually overlook?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.MINDFULNESS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-007",
        prompt_type="nudge",
        content="End your day with a thought. What's on your mind tonight?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.REFLECTION, PromptTag.EMOTIONS}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="nu-008",
        prompt_type="nudge",
        content="Morning thought: what's your intention for today?",
        mood_categories=ALL,
        tags=frozenset({PromptTag.GOALS, PromptTag.MINDFULNESS}),
        intensity=PromptIntensity.LIGHT,
    ),
)
