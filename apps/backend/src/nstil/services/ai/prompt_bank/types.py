from dataclasses import dataclass, field
from enum import StrEnum


class PromptIntensity(StrEnum):
    LIGHT = "light"
    MODERATE = "moderate"
    DEEP = "deep"


class PromptTag(StrEnum):
    GRATITUDE = "gratitude"
    RELATIONSHIPS = "relationships"
    WORK = "work"
    HEALTH = "health"
    GROWTH = "growth"
    CREATIVITY = "creativity"
    SELF_CARE = "self_care"
    EMOTIONS = "emotions"
    GOALS = "goals"
    MINDFULNESS = "mindfulness"
    IDENTITY = "identity"
    RESILIENCE = "resilience"
    JOY = "joy"
    LOSS = "loss"
    CHANGE = "change"
    BOUNDARIES = "boundaries"
    VALUES = "values"
    ENERGY = "energy"
    REFLECTION = "reflection"
    FUTURE = "future"


@dataclass(frozen=True, slots=True)
class CuratedPrompt:
    id: str
    prompt_type: str
    content: str
    mood_categories: frozenset[str]
    tags: frozenset[str] = field(default_factory=frozenset)
    intensity: PromptIntensity = PromptIntensity.MODERATE
