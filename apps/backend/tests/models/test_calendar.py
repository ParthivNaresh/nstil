from datetime import date

import pytest
from pydantic import ValidationError

from nstil.models.calendar import (
    CalendarDay,
    CalendarParams,
    CalendarResponse,
    compute_streak,
)


class TestCalendarParams:
    def test_valid(self) -> None:
        params = CalendarParams(year=2026, month=2)
        assert params.year == 2026
        assert params.month == 2

    def test_year_too_low(self) -> None:
        with pytest.raises(ValidationError):
            CalendarParams(year=2019, month=1)

    def test_year_too_high(self) -> None:
        with pytest.raises(ValidationError):
            CalendarParams(year=2101, month=1)

    def test_month_too_low(self) -> None:
        with pytest.raises(ValidationError):
            CalendarParams(year=2026, month=0)

    def test_month_too_high(self) -> None:
        with pytest.raises(ValidationError):
            CalendarParams(year=2026, month=13)


class TestCalendarDay:
    def test_valid(self) -> None:
        day = CalendarDay(
            date="2026-02-14",
            mood_category="happy",
            mood_specific="grateful",
            entry_count=3,
        )
        assert day.date == "2026-02-14"
        assert day.mood_category == "happy"
        assert day.entry_count == 3

    def test_null_mood(self) -> None:
        day = CalendarDay(
            date="2026-02-14",
            mood_category=None,
            mood_specific=None,
            entry_count=1,
        )
        assert day.mood_category is None
        assert day.mood_specific is None

    def test_extra_fields_ignored(self) -> None:
        day = CalendarDay(
            date="2026-02-14",
            mood_category=None,
            mood_specific=None,
            entry_count=1,
            extra_field="ignored",
        )
        assert not hasattr(day, "extra_field")


class TestCalendarResponse:
    def test_sorts_days(self) -> None:
        days = [
            {"date": "2026-02-15", "mood_category": None, "mood_specific": None, "entry_count": 1},
            {"date": "2026-02-01", "mood_category": None, "mood_specific": None, "entry_count": 2},
            {"date": "2026-02-10", "mood_category": None, "mood_specific": None, "entry_count": 1},
        ]
        response = CalendarResponse(
            year=2026, month=2, days=days, total_entries=4, streak=0
        )
        assert response.days[0].date == "2026-02-01"
        assert response.days[1].date == "2026-02-10"
        assert response.days[2].date == "2026-02-15"


class TestComputeStreak:
    def test_empty_days(self) -> None:
        assert compute_streak([], date(2026, 2, 14)) == 0

    def test_today_has_entry(self) -> None:
        days = [
            CalendarDay(date="2026-02-14", mood_category=None, mood_specific=None, entry_count=1),
        ]
        assert compute_streak(days, date(2026, 2, 14)) == 1

    def test_consecutive_streak(self) -> None:
        days = [
            CalendarDay(date="2026-02-12", mood_category=None, mood_specific=None, entry_count=1),
            CalendarDay(date="2026-02-13", mood_category=None, mood_specific=None, entry_count=2),
            CalendarDay(date="2026-02-14", mood_category=None, mood_specific=None, entry_count=1),
        ]
        assert compute_streak(days, date(2026, 2, 14)) == 3

    def test_streak_with_gap(self) -> None:
        days = [
            CalendarDay(date="2026-02-10", mood_category=None, mood_specific=None, entry_count=1),
            CalendarDay(date="2026-02-13", mood_category=None, mood_specific=None, entry_count=1),
            CalendarDay(date="2026-02-14", mood_category=None, mood_specific=None, entry_count=1),
        ]
        assert compute_streak(days, date(2026, 2, 14)) == 2

    def test_yesterday_streak_when_no_today(self) -> None:
        days = [
            CalendarDay(date="2026-02-12", mood_category=None, mood_specific=None, entry_count=1),
            CalendarDay(date="2026-02-13", mood_category=None, mood_specific=None, entry_count=1),
        ]
        assert compute_streak(days, date(2026, 2, 14)) == 2

    def test_no_streak_when_gap_before_yesterday(self) -> None:
        days = [
            CalendarDay(date="2026-02-11", mood_category=None, mood_specific=None, entry_count=1),
        ]
        assert compute_streak(days, date(2026, 2, 14)) == 0
