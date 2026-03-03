from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from nstil.models.ai_context import AIContextResponse
from nstil.models.ai_insight import AIInsightRow, InsightType
from nstil.models.calendar import CalendarDay, CalendarParams
from nstil.models.pagination import CursorParams
from nstil.observability import get_logger
from nstil.services.ai.insight import AIInsightService
from nstil.services.ai.insight_computations import (
    build_entry_milestone_insight,
    build_streak_insight,
    compute_streak_from_calendar,
    compute_weekly_summary,
    detect_mood_anomaly,
    find_entry_milestone,
    find_streak_milestone,
)
from nstil.services.cached_ai_context import CachedAIContextService
from nstil.services.cached_journal import CachedJournalService

logger = get_logger("nstil.ai.insight_engine")

PAST_WEEKS_TO_BACKFILL = 3
BACKFILL_DAYS_BACK = 28


def _sunday_week_start(reference: date) -> date:
    days_since_sunday = (reference.weekday() + 1) % 7
    return reference - timedelta(days=days_since_sunday)


def _find_weeks_with_entries(
    calendar_days: list[CalendarDay],
    current_week_start: date,
    max_past_weeks: int,
) -> list[date]:
    dates_with_entries: set[date] = {
        date.fromisoformat(d.date) for d in calendar_days if d.entry_count > 0
    }

    weeks: list[date] = []
    for offset in range(max_past_weeks + 1):
        week_start = current_week_start - timedelta(weeks=offset)
        week_end = week_start + timedelta(days=6)
        has_entries = any(week_start <= d <= week_end for d in dates_with_entries)
        if has_entries:
            weeks.append(week_start)

    weeks.sort()
    return weeks


class InsightEngine:
    def __init__(
        self,
        insight_service: AIInsightService,
        context_service: CachedAIContextService,
        journal_service: CachedJournalService,
    ) -> None:
        self._insights = insight_service
        self._context = context_service
        self._journal = journal_service

    async def run(self, user_id: UUID) -> list[AIInsightRow]:
        await self._cleanup_empty_summaries(user_id)

        generated: list[AIInsightRow] = []

        streak_insight = await self.check_streaks(user_id)
        if streak_insight is not None:
            generated.append(streak_insight)

        milestone_insight = await self.check_entry_milestone(user_id)
        if milestone_insight is not None:
            generated.append(milestone_insight)

        summary_insights = await self._generate_weekly_summaries(user_id)
        generated.extend(summary_insights)

        anomaly_insight = await self.detect_mood_anomaly(user_id)
        if anomaly_insight is not None:
            generated.append(anomaly_insight)

        if generated:
            logger.info(
                "insight_engine.run.completed",
                user_id=str(user_id),
                insights_generated=len(generated),
                types=[i.insight_type for i in generated],
            )

        return generated

    async def check_streaks(self, user_id: UUID) -> AIInsightRow | None:
        today = datetime.now(UTC).date()
        days = await self._fetch_calendar_days(user_id, today, months_back=2)

        streak = compute_streak_from_calendar(days, today)
        if streak == 0:
            return None

        milestone = find_streak_milestone(streak)
        if milestone is None:
            return None

        existing = await self._insights.list_by_period(
            user_id,
            period_start=today - timedelta(days=1),
            period_end=today,
            insight_type=InsightType.STREAK_MILESTONE.value,
        )
        for row in existing:
            if row.metadata.get("milestone") == milestone:
                return None

        create_data = build_streak_insight(streak, milestone, today)
        row = await self._insights.create(user_id, create_data)

        logger.info(
            "insight_engine.streak_milestone",
            user_id=str(user_id),
            streak=streak,
            milestone=milestone,
        )

        return row

    async def check_entry_milestone(self, user_id: UUID) -> AIInsightRow | None:
        context = await self._context.get_context(user_id)
        total = context.stats.total_entries

        milestone = find_entry_milestone(total)
        if milestone is None:
            return None

        today = datetime.now(UTC).date()
        existing = await self._insights.list_by_period(
            user_id,
            period_start=today - timedelta(days=7),
            period_end=today,
            insight_type=InsightType.STREAK_MILESTONE.value,
        )
        for row in existing:
            if row.metadata.get("milestone") == milestone:
                return None

        create_data = build_entry_milestone_insight(total, milestone, today)
        row = await self._insights.create(user_id, create_data)

        logger.info(
            "insight_engine.entry_milestone",
            user_id=str(user_id),
            total_entries=total,
            milestone=milestone,
        )

        return row

    async def _generate_weekly_summaries(
        self,
        user_id: UUID,
    ) -> list[AIInsightRow]:
        today = datetime.now(UTC).date()
        current_week_start = _sunday_week_start(today)
        calendar_days = await self._fetch_calendar_days(user_id, today, months_back=2)
        weeks_with_entries = _find_weeks_with_entries(
            calendar_days, current_week_start, PAST_WEEKS_TO_BACKFILL
        )

        context = await self._context.get_context(
            user_id, entry_limit=100, days_back=BACKFILL_DAYS_BACK
        )

        generated: list[AIInsightRow] = []
        for week_start in weeks_with_entries:
            row = await self._generate_summary_for_week(user_id, week_start, context)
            if row is not None:
                generated.append(row)

        return generated

    async def generate_weekly_summary(
        self,
        user_id: UUID,
        week_start: date | None = None,
    ) -> AIInsightRow | None:
        today = datetime.now(UTC).date()
        if week_start is None:
            week_start = _sunday_week_start(today)

        days_from_start = (today - week_start).days
        days_back = max(days_from_start + 7, 14)
        context = await self._context.get_context(user_id, entry_limit=100, days_back=days_back)
        return await self._generate_summary_for_week(user_id, week_start, context)

    async def _generate_summary_for_week(
        self,
        user_id: UUID,
        week_start: date,
        context: AIContextResponse,
    ) -> AIInsightRow | None:
        week_end = week_start + timedelta(days=6)

        existing = await self._insights.list_by_period(
            user_id,
            period_start=week_start,
            period_end=week_end,
            insight_type=InsightType.WEEKLY_SUMMARY.value,
        )

        create_data = compute_weekly_summary(context, week_start, week_end)
        entry_count: int = create_data.metadata.get("entry_count", 0)  # type: ignore[assignment]

        if existing:
            old_entry_count: int = existing[0].metadata.get("entry_count", 0)  # type: ignore[assignment]
            if entry_count == old_entry_count:
                return None
            if entry_count == 0:
                return None
            row = await self._insights.supersede(user_id, existing[0].id, create_data)
            logger.info(
                "insight_engine.weekly_summary.regenerated",
                user_id=str(user_id),
                period=f"{week_start} to {week_end}",
                entry_count=entry_count,
                superseded=str(existing[0].id),
            )
            return row

        row = await self._insights.create(user_id, create_data)
        logger.info(
            "insight_engine.weekly_summary",
            user_id=str(user_id),
            period=f"{week_start} to {week_end}",
            entry_count=entry_count,
        )
        return row

    async def detect_mood_anomaly(
        self,
        user_id: UUID,
        week_start: date | None = None,
    ) -> AIInsightRow | None:
        today = datetime.now(UTC).date()
        if week_start is None:
            week_start = _sunday_week_start(today)
        week_end = week_start + timedelta(days=6)

        existing = await self._insights.list_by_period(
            user_id,
            period_start=week_start,
            period_end=week_end,
            insight_type=InsightType.ANOMALY.value,
        )
        if existing:
            return None

        context = await self._context.get_context(user_id, entry_limit=50, days_back=28)

        create_data = detect_mood_anomaly(context, week_start, week_end)
        if create_data is None:
            return None

        row = await self._insights.create(user_id, create_data)

        logger.info(
            "insight_engine.mood_anomaly",
            user_id=str(user_id),
            direction=create_data.metadata.get("direction"),
            difference=create_data.metadata.get("difference"),
        )

        return row

    async def _cleanup_empty_summaries(self, user_id: UUID) -> None:
        today = datetime.now(UTC).date()
        current_week_start = _sunday_week_start(today)

        params = CursorParams(limit=50)
        rows, _ = await self._insights.list_insights(
            user_id,
            params,
            insight_type=InsightType.WEEKLY_SUMMARY.value,
        )

        for row in rows:
            if row.period_start is None:
                continue
            row_start = (
                row.period_start
                if isinstance(row.period_start, date)
                else date.fromisoformat(str(row.period_start))
            )
            if row_start >= current_week_start:
                continue
            if row.metadata.get("entry_count", 0) == 0:
                await self._insights.soft_delete(user_id, row.id)
                logger.info(
                    "insight_engine.cleanup.empty_summary",
                    user_id=str(user_id),
                    insight_id=str(row.id),
                    period_start=str(row.period_start),
                )

    async def _fetch_calendar_days(
        self,
        user_id: UUID,
        reference_date: date,
        months_back: int = 2,
    ) -> list[CalendarDay]:
        all_days: list[CalendarDay] = []
        current = reference_date
        for _ in range(months_back):
            params = CalendarParams(
                year=current.year,
                month=current.month,
            )
            days = await self._journal.get_calendar(user_id, params)
            all_days.extend(days)
            first_of_month = current.replace(day=1)
            current = first_of_month - timedelta(days=1)
        return all_days
