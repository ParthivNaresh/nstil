from collections import Counter
from datetime import date, timedelta
from uuid import UUID

from nstil.models.ai_context import AIContextEntry, AIContextResponse
from nstil.models.ai_insight import AIInsightCreate, InsightSource, InsightType
from nstil.models.calendar import CalendarDay

STREAK_MILESTONES: tuple[int, ...] = (3, 7, 14, 21, 30, 50, 60, 90, 100, 150, 180, 200, 365)
ENTRY_MILESTONES: tuple[int, ...] = (1, 5, 10, 25, 50, 100, 200, 365, 500, 1000)
ANOMALY_THRESHOLD = 0.3


def compute_streak_from_calendar(
    days: list[CalendarDay], reference_date: date
) -> int:
    dates_with_entries = {
        date.fromisoformat(d.date)
        for d in days
        if d.entry_count > 0
    }
    check_date = reference_date
    if check_date not in dates_with_entries:
        check_date = check_date - timedelta(days=1)
        if check_date not in dates_with_entries:
            return 0
    streak = 0
    while check_date in dates_with_entries:
        streak += 1
        check_date -= timedelta(days=1)
    return streak


def find_streak_milestone(streak: int) -> int | None:
    for milestone in STREAK_MILESTONES:
        if streak == milestone:
            return milestone
    return None


def find_entry_milestone(total_entries: int) -> int | None:
    for milestone in ENTRY_MILESTONES:
        if total_entries == milestone:
            return milestone
    return None


def build_streak_insight(
    streak: int, milestone: int, reference_date: date
) -> AIInsightCreate:
    return AIInsightCreate(
        insight_type=InsightType.STREAK_MILESTONE,
        title=f"{milestone}-day journaling streak!",
        content=f"You've journaled {milestone} days in a row. Keep it up!",
        source=InsightSource.COMPUTED,
        confidence=1.0,
        period_start=reference_date,
        period_end=reference_date,
        metadata={"streak_length": streak, "milestone": milestone},
    )


def build_entry_milestone_insight(
    total_entries: int, milestone: int, reference_date: date
) -> AIInsightCreate:
    return AIInsightCreate(
        insight_type=InsightType.STREAK_MILESTONE,
        title=f"{milestone} entries milestone!",
        content=(
            f"You've written {milestone} journal entries."
            " That's a meaningful commitment to self-reflection."
        ),
        source=InsightSource.COMPUTED,
        confidence=1.0,
        period_start=reference_date,
        period_end=reference_date,
        metadata={"total_entries": total_entries, "milestone": milestone},
    )


def compute_weekly_summary(
    context: AIContextResponse,
    period_start: date,
    period_end: date,
) -> AIInsightCreate:
    entries = _entries_in_period(context.recent_entries, period_start, period_end)
    entry_count = len(entries)
    entry_ids = [UUID(e.id) for e in entries]

    mood_counts = _mood_distribution_from_entries(entries)
    dominant_mood = mood_counts.most_common(1)[0][0] if mood_counts else None

    tag_counts = _tag_distribution_from_entries(entries)
    top_tags = [tag for tag, _ in tag_counts.most_common(5)]

    total_length = sum(len(e.body) for e in entries)
    avg_length = total_length // entry_count if entry_count > 0 else 0

    entry_types = Counter(e.entry_type for e in entries)

    title = f"Week of {period_start.strftime('%b %d')}"
    content = _format_weekly_content(
        entry_count=entry_count,
        dominant_mood=dominant_mood,
        top_tags=top_tags,
        avg_length=avg_length,
    )

    return AIInsightCreate(
        insight_type=InsightType.WEEKLY_SUMMARY,
        title=title,
        content=content,
        supporting_entry_ids=entry_ids,
        source=InsightSource.COMPUTED,
        confidence=1.0,
        period_start=period_start,
        period_end=period_end,
        metadata={
            "entry_count": entry_count,
            "dominant_mood": dominant_mood,
            "mood_distribution": dict(mood_counts),
            "top_tags": top_tags,
            "avg_entry_length": avg_length,
            "entry_types": dict(entry_types),
        },
    )


def detect_mood_anomaly(
    context: AIContextResponse,
    period_start: date,
    period_end: date,
) -> AIInsightCreate | None:
    if not context.mood_distribution:
        return None

    entries = _entries_in_period(context.recent_entries, period_start, period_end)
    if len(entries) < 2:
        return None

    week_moods = _mood_distribution_from_entries(entries)
    if not week_moods:
        return None

    overall_total = sum(m.count for m in context.mood_distribution)
    if overall_total == 0:
        return None

    difficult_moods = frozenset({"sad", "anxious", "angry"})

    overall_difficult_ratio = sum(
        m.count for m in context.mood_distribution
        if m.mood_category in difficult_moods
    ) / overall_total

    week_total = sum(week_moods.values())
    week_difficult_ratio = sum(
        count for mood, count in week_moods.items()
        if mood in difficult_moods
    ) / week_total

    diff = week_difficult_ratio - overall_difficult_ratio
    if abs(diff) < ANOMALY_THRESHOLD:
        return None

    entry_ids = [UUID(e.id) for e in entries]

    if diff > 0:
        title = "Your mood has been lower than usual"
        content = (
            "This week's entries show more difficult emotions"
            " compared to your recent average."
            " It's okay to have tough weeks — acknowledging it is a strength."
        )
    else:
        title = "Your mood has been brighter than usual"
        content = (
            "This week's entries show more positive emotions"
            " compared to your recent average."
            " Take a moment to appreciate what's going well."
        )

    return AIInsightCreate(
        insight_type=InsightType.ANOMALY,
        title=title,
        content=content,
        supporting_entry_ids=entry_ids,
        source=InsightSource.COMPUTED,
        confidence=min(abs(diff) / 0.5, 1.0),
        period_start=period_start,
        period_end=period_end,
        metadata={
            "overall_difficult_ratio": round(overall_difficult_ratio, 3),
            "week_difficult_ratio": round(week_difficult_ratio, 3),
            "difference": round(diff, 3),
            "direction": "negative" if diff > 0 else "positive",
        },
    )


def _entries_in_period(
    entries: list[AIContextEntry],
    period_start: date,
    period_end: date,
) -> list[AIContextEntry]:
    return [
        e for e in entries
        if period_start <= e.created_at.date() <= period_end
    ]


def _mood_distribution_from_entries(
    entries: list[AIContextEntry],
) -> Counter[str]:
    return Counter(
        e.mood_category
        for e in entries
        if e.mood_category is not None
    )


def _tag_distribution_from_entries(
    entries: list[AIContextEntry],
) -> Counter[str]:
    counter: Counter[str] = Counter()
    for entry in entries:
        counter.update(entry.tags)
    return counter


def _format_weekly_content(
    entry_count: int,
    dominant_mood: str | None,
    top_tags: list[str],
    avg_length: int,
) -> str:
    parts: list[str] = []

    if entry_count == 0:
        return "No entries this week. That's okay — your journal is here when you're ready."

    label = "entry" if entry_count == 1 else "entries"
    parts.append(f"You wrote {entry_count} {label} this week.")

    if dominant_mood:
        parts.append(f"Your most common mood was {dominant_mood}.")

    if top_tags:
        tag_str = ", ".join(top_tags[:3])
        parts.append(f"Top themes: {tag_str}.")

    if avg_length > 0:
        parts.append(f"Average entry length: {avg_length} characters.")

    return " ".join(parts)
