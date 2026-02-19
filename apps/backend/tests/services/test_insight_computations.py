from datetime import UTC, date, datetime, timedelta

from nstil.models.ai_context import (
    AIContextEntry,
    AIContextMoodDistribution,
    AIContextProfile,
    AIContextResponse,
    AIContextStats,
)
from nstil.models.calendar import CalendarDay
from nstil.services.ai.insight_computations import (
    ENTRY_MILESTONES,
    STREAK_MILESTONES,
    _format_weekly_content,
    compute_streak_from_calendar,
    compute_weekly_summary,
    detect_mood_anomaly,
    find_entry_milestone,
    find_streak_milestone,
)


def _day(d: date, count: int = 1) -> CalendarDay:
    return CalendarDay(
        date=d.isoformat(),
        mood_category="calm" if count > 0 else None,
        mood_specific=None,
        entry_count=count,
    )


def _entry(
    *,
    days_ago: int = 0,
    mood: str | None = "calm",
    body: str = "Test entry body text.",
    tags: list[str] | None = None,
    entry_type: str = "journal",
) -> AIContextEntry:
    created = datetime.now(UTC) - timedelta(days=days_ago)
    return AIContextEntry(
        id="00000000-0000-0000-0000-000000000001",
        title="Test",
        body=body,
        mood_category=mood,
        mood_specific=None,
        tags=tags or [],
        entry_type=entry_type,
        location=None,
        journal_name="My Journal",
        created_at=created,
    )


def _context(
    entries: list[AIContextEntry] | None = None,
    mood_dist: list[AIContextMoodDistribution] | None = None,
    total_entries: int = 10,
) -> AIContextResponse:
    return AIContextResponse(
        recent_entries=entries or [],
        mood_distribution=mood_dist or [],
        recent_prompts=[],
        recent_sessions=[],
        stats=AIContextStats(
            total_entries=total_entries,
            entries_last_7d=len(entries or []),
            check_ins_total=0,
            check_ins_last_7d=0,
            avg_entry_length_7d=None,
            last_entry_at=None,
        ),
        profile=AIContextProfile(
            prompt_style="gentle",
            topics_to_avoid=[],
            goals=[],
        ),
    )


class TestComputeStreakFromCalendar:
    def test_empty_days(self) -> None:
        assert compute_streak_from_calendar([], date(2025, 1, 15)) == 0

    def test_no_entries(self) -> None:
        days = [_day(date(2025, 1, 15), count=0)]
        assert compute_streak_from_calendar(days, date(2025, 1, 15)) == 0

    def test_single_day_today(self) -> None:
        today = date(2025, 1, 15)
        days = [_day(today)]
        assert compute_streak_from_calendar(days, today) == 1

    def test_consecutive_days(self) -> None:
        today = date(2025, 1, 15)
        days = [_day(today - timedelta(days=i)) for i in range(7)]
        assert compute_streak_from_calendar(days, today) == 7

    def test_gap_breaks_streak(self) -> None:
        today = date(2025, 1, 15)
        days = [
            _day(today),
            _day(today - timedelta(days=1)),
            _day(today - timedelta(days=2)),
            _day(today - timedelta(days=4)),
        ]
        assert compute_streak_from_calendar(days, today) == 3

    def test_today_missing_yesterday_present(self) -> None:
        today = date(2025, 1, 15)
        yesterday = today - timedelta(days=1)
        days = [
            _day(yesterday),
            _day(yesterday - timedelta(days=1)),
            _day(yesterday - timedelta(days=2)),
        ]
        assert compute_streak_from_calendar(days, today) == 3

    def test_today_and_yesterday_both_missing(self) -> None:
        today = date(2025, 1, 15)
        days = [_day(today - timedelta(days=2))]
        assert compute_streak_from_calendar(days, today) == 0

    def test_days_with_zero_entries_ignored(self) -> None:
        today = date(2025, 1, 15)
        days = [
            _day(today),
            _day(today - timedelta(days=1), count=0),
            _day(today - timedelta(days=2)),
        ]
        assert compute_streak_from_calendar(days, today) == 1


class TestFindStreakMilestone:
    def test_exact_match(self) -> None:
        for milestone in STREAK_MILESTONES:
            assert find_streak_milestone(milestone) == milestone

    def test_non_milestone_returns_none(self) -> None:
        assert find_streak_milestone(2) is None
        assert find_streak_milestone(8) is None
        assert find_streak_milestone(15) is None
        assert find_streak_milestone(0) is None

    def test_boundary_just_below(self) -> None:
        assert find_streak_milestone(6) is None
        assert find_streak_milestone(29) is None


class TestFindEntryMilestone:
    def test_exact_match(self) -> None:
        for milestone in ENTRY_MILESTONES:
            assert find_entry_milestone(milestone) == milestone

    def test_non_milestone_returns_none(self) -> None:
        assert find_entry_milestone(2) is None
        assert find_entry_milestone(11) is None
        assert find_entry_milestone(0) is None

    def test_boundary_just_above(self) -> None:
        assert find_entry_milestone(6) is None
        assert find_entry_milestone(101) is None


class TestComputeWeeklySummary:
    def test_zero_entries(self) -> None:
        ctx = _context(entries=[])
        start = date(2025, 1, 6)
        end = date(2025, 1, 12)
        result = compute_weekly_summary(ctx, start, end)
        assert result.insight_type.value == "weekly_summary"
        assert result.metadata["entry_count"] == 0
        assert "no entries" in result.content.lower() or "No entries" in result.content

    def test_single_entry(self) -> None:
        entries = [_entry(days_ago=1, mood="happy", body="Great day!", tags=["work"])]
        ctx = _context(entries=entries)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = compute_weekly_summary(ctx, start, end)
        assert result.metadata["entry_count"] == 1
        assert result.metadata["dominant_mood"] == "happy"
        assert "1 entry" in result.content

    def test_multiple_entries_with_moods_and_tags(self) -> None:
        entries = [
            _entry(days_ago=1, mood="happy", body="Good day", tags=["work", "health"]),
            _entry(days_ago=2, mood="happy", body="Another good day", tags=["work"]),
            _entry(days_ago=3, mood="calm", body="Peaceful", tags=["nature"]),
        ]
        ctx = _context(entries=entries)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = compute_weekly_summary(ctx, start, end)
        assert result.metadata["entry_count"] == 3
        assert result.metadata["dominant_mood"] == "happy"
        assert "work" in result.metadata["top_tags"]
        assert "3 entries" in result.content

    def test_avg_length_calculation(self) -> None:
        entries = [
            _entry(days_ago=1, body="a" * 100),
            _entry(days_ago=2, body="b" * 200),
        ]
        ctx = _context(entries=entries)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = compute_weekly_summary(ctx, start, end)
        assert result.metadata["avg_entry_length"] == 150

    def test_entries_outside_period_excluded(self) -> None:
        entries = [
            _entry(days_ago=1, mood="happy"),
            _entry(days_ago=30, mood="sad"),
        ]
        ctx = _context(entries=entries)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = compute_weekly_summary(ctx, start, end)
        assert result.metadata["entry_count"] == 1

    def test_period_dates_set(self) -> None:
        ctx = _context(entries=[])
        start = date(2025, 1, 6)
        end = date(2025, 1, 12)
        result = compute_weekly_summary(ctx, start, end)
        assert result.period_start == start
        assert result.period_end == end


class TestDetectMoodAnomaly:
    def test_no_mood_data_returns_none(self) -> None:
        ctx = _context(entries=[_entry(days_ago=1)], mood_dist=[])
        start = date.today() - timedelta(days=7)
        end = date.today()
        assert detect_mood_anomaly(ctx, start, end) is None

    def test_insufficient_entries_returns_none(self) -> None:
        ctx = _context(
            entries=[_entry(days_ago=1, mood="sad")],
            mood_dist=[
                AIContextMoodDistribution(mood_category="sad", mood_specific=None, count=5),
            ],
        )
        start = date.today() - timedelta(days=7)
        end = date.today()
        assert detect_mood_anomaly(ctx, start, end) is None

    def test_below_threshold_returns_none(self) -> None:
        entries = [
            _entry(days_ago=1, mood="happy"),
            _entry(days_ago=2, mood="calm"),
        ]
        mood_dist = [
            AIContextMoodDistribution(mood_category="happy", mood_specific=None, count=10),
            AIContextMoodDistribution(mood_category="calm", mood_specific=None, count=10),
        ]
        ctx = _context(entries=entries, mood_dist=mood_dist)
        start = date.today() - timedelta(days=7)
        end = date.today()
        assert detect_mood_anomaly(ctx, start, end) is None

    def test_negative_anomaly_detected(self) -> None:
        entries = [
            _entry(days_ago=1, mood="sad"),
            _entry(days_ago=2, mood="anxious"),
            _entry(days_ago=3, mood="sad"),
        ]
        mood_dist = [
            AIContextMoodDistribution(mood_category="happy", mood_specific=None, count=15),
            AIContextMoodDistribution(mood_category="calm", mood_specific=None, count=10),
            AIContextMoodDistribution(mood_category="sad", mood_specific=None, count=2),
            AIContextMoodDistribution(mood_category="anxious", mood_specific=None, count=1),
        ]
        ctx = _context(entries=entries, mood_dist=mood_dist)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = detect_mood_anomaly(ctx, start, end)
        assert result is not None
        assert result.insight_type.value == "anomaly"
        assert result.metadata["direction"] == "negative"
        assert result.metadata["difference"] > 0

    def test_positive_anomaly_detected(self) -> None:
        entries = [
            _entry(days_ago=1, mood="happy"),
            _entry(days_ago=2, mood="happy"),
            _entry(days_ago=3, mood="calm"),
        ]
        mood_dist = [
            AIContextMoodDistribution(mood_category="sad", mood_specific=None, count=15),
            AIContextMoodDistribution(mood_category="anxious", mood_specific=None, count=10),
            AIContextMoodDistribution(mood_category="happy", mood_specific=None, count=2),
            AIContextMoodDistribution(mood_category="calm", mood_specific=None, count=1),
        ]
        ctx = _context(entries=entries, mood_dist=mood_dist)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = detect_mood_anomaly(ctx, start, end)
        assert result is not None
        assert result.metadata["direction"] == "positive"
        assert result.metadata["difference"] < 0

    def test_confidence_scales_with_magnitude(self) -> None:
        entries = [
            _entry(days_ago=1, mood="sad"),
            _entry(days_ago=2, mood="anxious"),
            _entry(days_ago=3, mood="angry"),
        ]
        mood_dist = [
            AIContextMoodDistribution(mood_category="happy", mood_specific=None, count=50),
            AIContextMoodDistribution(mood_category="calm", mood_specific=None, count=50),
        ]
        ctx = _context(entries=entries, mood_dist=mood_dist)
        start = date.today() - timedelta(days=7)
        end = date.today()
        result = detect_mood_anomaly(ctx, start, end)
        assert result is not None
        assert 0.0 < result.confidence <= 1.0

    def test_entries_without_mood_ignored(self) -> None:
        entries = [
            _entry(days_ago=1, mood=None),
            _entry(days_ago=2, mood=None),
            _entry(days_ago=3, mood=None),
        ]
        mood_dist = [
            AIContextMoodDistribution(mood_category="happy", mood_specific=None, count=10),
        ]
        ctx = _context(entries=entries, mood_dist=mood_dist)
        start = date.today() - timedelta(days=7)
        end = date.today()
        assert detect_mood_anomaly(ctx, start, end) is None


class TestFormatWeeklyContent:
    def test_zero_entries(self) -> None:
        result = _format_weekly_content(
            entry_count=0, dominant_mood=None, top_tags=[], avg_length=0
        )
        assert "No entries" in result

    def test_singular_entry(self) -> None:
        result = _format_weekly_content(
            entry_count=1, dominant_mood="happy", top_tags=[], avg_length=100
        )
        assert "1 entry" in result
        assert "entries" not in result.replace("1 entry", "")

    def test_plural_entries(self) -> None:
        result = _format_weekly_content(
            entry_count=5, dominant_mood="calm", top_tags=["work"], avg_length=200
        )
        assert "5 entries" in result

    def test_includes_mood(self) -> None:
        result = _format_weekly_content(
            entry_count=3, dominant_mood="happy", top_tags=[], avg_length=100
        )
        assert "happy" in result

    def test_includes_tags(self) -> None:
        result = _format_weekly_content(
            entry_count=3, dominant_mood=None, top_tags=["work", "health"], avg_length=100
        )
        assert "work" in result
        assert "health" in result

    def test_no_mood_omits_mood_line(self) -> None:
        result = _format_weekly_content(
            entry_count=3, dominant_mood=None, top_tags=[], avg_length=100
        )
        assert "mood" not in result.lower()

    def test_no_tags_omits_tags_line(self) -> None:
        result = _format_weekly_content(
            entry_count=3, dominant_mood=None, top_tags=[], avg_length=100
        )
        assert "themes" not in result.lower()
