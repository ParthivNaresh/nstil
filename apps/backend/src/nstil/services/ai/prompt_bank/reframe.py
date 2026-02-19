from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

DIFFICULT = frozenset({"sad", "anxious", "angry"})
ALL = frozenset({"happy", "calm", "sad", "anxious", "angry", "neutral"})

REFRAME_PROMPTS: tuple[CuratedPrompt, ...] = (
    CuratedPrompt(
        id="re-001",
        prompt_type="reframe",
        content="What if this situation is teaching you something you needed to learn?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.GROWTH, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-002",
        prompt_type="reframe",
        content="How might you see this differently a month from now?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.REFLECTION, PromptTag.CHANGE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-003",
        prompt_type="reframe",
        content="What's one thing that went right today, even if it was small?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.GRATITUDE, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="re-004",
        prompt_type="reframe",
        content="Is there another way to interpret what happened?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.REFLECTION, PromptTag.GROWTH}),
        intensity=PromptIntensity.DEEP,
    ),
    CuratedPrompt(
        id="re-005",
        prompt_type="reframe",
        content="What would you say to someone you love who was going through this?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.SELF_CARE, PromptTag.RELATIONSHIPS}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-006",
        prompt_type="reframe",
        content="What part of this is within your control?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.BOUNDARIES, PromptTag.RESILIENCE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-007",
        prompt_type="reframe",
        content="Think of a past challenge you overcame. What helped you then?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.GROWTH}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-008",
        prompt_type="reframe",
        content="What's the most compassionate thing you could do for yourself right now?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.SELF_CARE}),
        intensity=PromptIntensity.LIGHT,
    ),
    CuratedPrompt(
        id="re-009",
        prompt_type="reframe",
        content=(
            "Sometimes setbacks are setups for something better."
            " Can you see a possibility here?"
        ),
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.RESILIENCE, PromptTag.FUTURE}),
        intensity=PromptIntensity.MODERATE,
    ),
    CuratedPrompt(
        id="re-010",
        prompt_type="reframe",
        content="What boundary might you need to set to protect your peace?",
        mood_categories=DIFFICULT,
        tags=frozenset({PromptTag.BOUNDARIES, PromptTag.SELF_CARE}),
        intensity=PromptIntensity.DEEP,
    ),
)
