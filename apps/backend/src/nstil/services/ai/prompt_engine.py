from datetime import UTC, datetime, timedelta
from uuid import UUID

from nstil.models.ai_context import AIContextResponse
from nstil.models.ai_prompt import AIPromptCreate, AIPromptRow, PromptSource, PromptType
from nstil.models.mood import MoodCategory
from nstil.observability import get_logger
from nstil.services.ai.prompt import AIPromptService
from nstil.services.ai.prompt_bank import CuratedPrompt, PromptBank, PromptIntensity
from nstil.services.cached_ai_context import CachedAIContextService

logger = get_logger("nstil.ai.prompt_engine")

INACTIVITY_THRESHOLD_DAYS = 3
GOAL_CHECK_INTERVAL_DAYS = 7
DIFFICULT_MOOD_THRESHOLD = 3

_STYLE_TO_INTENSITY: dict[str, PromptIntensity] = {
    "gentle": PromptIntensity.LIGHT,
    "direct": PromptIntensity.MODERATE,
    "analytical": PromptIntensity.DEEP,
    "motivational": PromptIntensity.DEEP,
}

_VALID_MOOD_CATEGORIES: frozenset[str] = frozenset(m.value for m in MoodCategory)

_DIFFICULT_MOODS: frozenset[str] = frozenset({"sad", "anxious", "angry"})

_ENGAGEMENT_ENTRY_TYPES: frozenset[str] = frozenset({"check_in", "mood_snapshot"})


def _get_dominant_mood(
    context: AIContextResponse,
) -> str | None:
    if not context.mood_distribution:
        return None
    return context.mood_distribution[0].mood_category


def _has_engaged_today(context: AIContextResponse) -> bool:
    now = datetime.now(UTC)
    for entry in context.recent_entries:
        if entry.entry_type in _ENGAGEMENT_ENTRY_TYPES and entry.created_at.date() == now.date():
            return True
    return False


def _days_since_last_entry(context: AIContextResponse) -> int | None:
    if context.stats.last_entry_at is None:
        return None
    delta = datetime.now(UTC) - context.stats.last_entry_at
    return delta.days


def _has_recent_goal_check(context: AIContextResponse) -> bool:
    cutoff = datetime.now(UTC) - timedelta(days=GOAL_CHECK_INTERVAL_DAYS)
    for prompt in context.recent_prompts:
        if prompt.prompt_type == "goal_check" and prompt.created_at >= cutoff:
            return True
    return False


def _count_difficult_moods(context: AIContextResponse) -> int:
    return sum(m.count for m in context.mood_distribution if m.mood_category in _DIFFICULT_MOODS)


def _build_exclude_ids(context: AIContextResponse) -> frozenset[str]:
    ids: set[str] = set()
    for prompt in context.recent_prompts:
        if prompt.source == "curated":
            for p in PromptBank.get_by_type(prompt.prompt_type):
                if p.content == prompt.content:
                    ids.add(p.id)
                    break
    return frozenset(ids)


def _build_exclude_topics(context: AIContextResponse) -> frozenset[str]:
    return frozenset(context.profile.topics_to_avoid)


def _resolve_mood_for_db(mood: str | None) -> MoodCategory | None:
    if mood is None or mood not in _VALID_MOOD_CATEGORIES:
        return None
    return MoodCategory(mood)


def _build_context_snapshot(
    context: AIContextResponse,
    determined_type: str,
    dominant_mood: str | None,
) -> dict[str, object]:
    return {
        "determined_type": determined_type,
        "dominant_mood": dominant_mood,
        "total_entries": context.stats.total_entries,
        "entries_last_7d": context.stats.entries_last_7d,
        "check_ins_last_7d": context.stats.check_ins_last_7d,
        "mood_distribution": [
            {
                "mood": m.mood_category,
                "count": m.count,
            }
            for m in context.mood_distribution[:5]
        ],
        "recent_prompt_count": len(context.recent_prompts),
        "prompt_style": context.profile.prompt_style,
    }


class PromptEngine:
    def __init__(
        self,
        context_service: CachedAIContextService,
        prompt_service: AIPromptService,
    ) -> None:
        self._context = context_service
        self._prompts = prompt_service

    async def generate(
        self,
        user_id: UUID,
        prompt_type: PromptType | None = None,
        session_id: UUID | None = None,
        entry_id: UUID | None = None,
    ) -> AIPromptRow | None:
        context = await self._context.get_context(user_id)

        determined_type = (
            prompt_type.value
            if prompt_type is not None
            else self._determine_type(context, entry_id)
        )

        dominant_mood = _get_dominant_mood(context)
        max_intensity = _STYLE_TO_INTENSITY.get(
            context.profile.prompt_style, PromptIntensity.MODERATE
        )
        exclude_ids = _build_exclude_ids(context)
        exclude_topics = _build_exclude_topics(context)

        selected = _select_with_fallback(
            prompt_type=determined_type,
            mood_category=dominant_mood,
            max_intensity=max_intensity,
            exclude_ids=exclude_ids,
            exclude_topics=exclude_topics,
        )

        if selected is None:
            logger.warning(
                "prompt_engine.no_prompt_available",
                user_id=str(user_id),
                prompt_type=determined_type,
                mood=dominant_mood,
            )
            return None

        create_data = AIPromptCreate(
            prompt_type=PromptType(determined_type),
            content=selected.content,
            source=PromptSource.CURATED,
            mood_category=_resolve_mood_for_db(dominant_mood),
            session_id=session_id,
            entry_id=entry_id,
            context=_build_context_snapshot(context, determined_type, dominant_mood),
        )

        row = await self._prompts.create(user_id, create_data)

        logger.info(
            "prompt_engine.generated",
            user_id=str(user_id),
            prompt_type=determined_type,
            prompt_id=selected.id,
            mood=dominant_mood,
        )

        return row

    def _determine_type(
        self,
        context: AIContextResponse,
        entry_id: UUID | None,
    ) -> str:
        if entry_id is not None:
            return PromptType.REFLECTION.value

        days_inactive = _days_since_last_entry(context)
        if days_inactive is not None and days_inactive >= INACTIVITY_THRESHOLD_DAYS:
            return PromptType.NUDGE.value

        if not _has_engaged_today(context):
            return PromptType.CHECK_IN.value

        difficult_count = _count_difficult_moods(context)
        if difficult_count >= DIFFICULT_MOOD_THRESHOLD:
            return PromptType.AFFIRMATION.value

        if context.profile.goals and not _has_recent_goal_check(context):
            return PromptType.GOAL_CHECK.value

        return PromptType.GUIDED.value


def _select_with_fallback(
    prompt_type: str,
    mood_category: str | None,
    max_intensity: PromptIntensity,
    exclude_ids: frozenset[str],
    exclude_topics: frozenset[str],
) -> CuratedPrompt | None:
    result = PromptBank.get_random(
        prompt_type=prompt_type,
        mood_category=mood_category,
        exclude_ids=exclude_ids,
        exclude_topics=exclude_topics,
        max_intensity=max_intensity,
    )
    if result is not None:
        return result

    result = PromptBank.get_random(
        prompt_type=prompt_type,
        mood_category=mood_category,
        exclude_topics=exclude_topics,
        max_intensity=max_intensity,
    )
    if result is not None:
        return result

    result = PromptBank.get_random(
        prompt_type=prompt_type,
        mood_category=mood_category,
    )
    if result is not None:
        return result

    return PromptBank.get_random(prompt_type=prompt_type)
