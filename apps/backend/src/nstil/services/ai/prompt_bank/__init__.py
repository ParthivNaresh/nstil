import random
from collections import defaultdict

from nstil.services.ai.prompt_bank.affirmation import AFFIRMATION_PROMPTS
from nstil.services.ai.prompt_bank.check_in import CHECK_IN_PROMPTS
from nstil.services.ai.prompt_bank.goal_check import GOAL_CHECK_PROMPTS
from nstil.services.ai.prompt_bank.guided import GUIDED_PROMPTS
from nstil.services.ai.prompt_bank.nudge import NUDGE_PROMPTS
from nstil.services.ai.prompt_bank.reflection import REFLECTION_PROMPTS
from nstil.services.ai.prompt_bank.reframe import REFRAME_PROMPTS
from nstil.services.ai.prompt_bank.types import CuratedPrompt, PromptIntensity, PromptTag

_ALL_PROMPTS: tuple[CuratedPrompt, ...] = (
    *CHECK_IN_PROMPTS,
    *REFLECTION_PROMPTS,
    *NUDGE_PROMPTS,
    *AFFIRMATION_PROMPTS,
    *REFRAME_PROMPTS,
    *GUIDED_PROMPTS,
    *GOAL_CHECK_PROMPTS,
)

_BY_TYPE: dict[str, tuple[CuratedPrompt, ...]] = {}
_BY_ID: dict[str, CuratedPrompt] = {}


def _build_indexes() -> None:
    grouped: dict[str, list[CuratedPrompt]] = defaultdict(list)
    seen_ids: set[str] = set()
    for prompt in _ALL_PROMPTS:
        if prompt.id in seen_ids:
            msg = f"Duplicate prompt id: {prompt.id}"
            raise ValueError(msg)
        seen_ids.add(prompt.id)
        _BY_ID[prompt.id] = prompt
        grouped[prompt.prompt_type].append(prompt)
    for prompt_type, prompts in grouped.items():
        _BY_TYPE[prompt_type] = tuple(prompts)


_build_indexes()


class PromptBank:
    @staticmethod
    def get_by_id(prompt_id: str) -> CuratedPrompt | None:
        return _BY_ID.get(prompt_id)

    @staticmethod
    def get_by_type(
        prompt_type: str,
        mood_category: str | None = None,
    ) -> list[CuratedPrompt]:
        prompts = _BY_TYPE.get(prompt_type, ())
        if mood_category is None:
            return list(prompts)
        mood = mood_category
        return [p for p in prompts if mood in p.mood_categories or "neutral" in p.mood_categories]

    @staticmethod
    def get_filtered(
        prompt_type: str,
        mood_category: str | None = None,
        exclude_ids: frozenset[str] | None = None,
        exclude_topics: frozenset[str] | None = None,
        max_intensity: PromptIntensity | None = None,
    ) -> list[CuratedPrompt]:
        _intensity_order = {
            PromptIntensity.LIGHT: 0,
            PromptIntensity.MODERATE: 1,
            PromptIntensity.DEEP: 2,
        }

        candidates = PromptBank.get_by_type(prompt_type, mood_category)

        if exclude_ids:
            candidates = [p for p in candidates if p.id not in exclude_ids]

        if exclude_topics:
            candidates = [p for p in candidates if not p.tags & exclude_topics]

        if max_intensity is not None:
            threshold = _intensity_order[max_intensity]
            candidates = [p for p in candidates if _intensity_order[p.intensity] <= threshold]

        return candidates

    @staticmethod
    def get_random(
        prompt_type: str,
        mood_category: str | None = None,
        exclude_ids: frozenset[str] | None = None,
        exclude_topics: frozenset[str] | None = None,
        max_intensity: PromptIntensity | None = None,
    ) -> CuratedPrompt | None:
        candidates = PromptBank.get_filtered(
            prompt_type=prompt_type,
            mood_category=mood_category,
            exclude_ids=exclude_ids,
            exclude_topics=exclude_topics,
            max_intensity=max_intensity,
        )
        if not candidates:
            return None
        return random.choice(candidates)

    @staticmethod
    def count() -> int:
        return len(_ALL_PROMPTS)

    @staticmethod
    def count_by_type(prompt_type: str) -> int:
        return len(_BY_TYPE.get(prompt_type, ()))

    @staticmethod
    def available_types() -> list[str]:
        return sorted(_BY_TYPE.keys())


__all__ = ["CuratedPrompt", "PromptBank", "PromptIntensity", "PromptTag"]
