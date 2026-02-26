from datetime import date, timedelta
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CalendarParams(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    month: int = Field(..., ge=1, le=12)
    timezone: str = Field(default="UTC", max_length=50)
    journal_id: UUID | None = None


class MoodTrendParams(BaseModel):
    days: int = Field(default=7, ge=1, le=90)
    timezone: str = Field(default="UTC", max_length=50)


class DailyMoodCount(BaseModel):
    date: str
    mood_category: str
    entry_count: int

    model_config = {"extra": "ignore"}


class MoodTrendResponse(BaseModel):
    items: list[DailyMoodCount]
    days: int


class CalendarDay(BaseModel):
    date: str
    mood_category: str | None
    mood_specific: str | None
    entry_count: int

    model_config = {"extra": "ignore"}


class CalendarResponse(BaseModel):
    year: int
    month: int
    days: list[CalendarDay]
    total_entries: int
    streak: int

    @field_validator("days", mode="before")
    @classmethod
    def sort_days(cls, v: list[CalendarDay]) -> list[CalendarDay]:
        return sorted(v, key=lambda d: d.date if isinstance(d, CalendarDay) else d["date"])


def compute_streak(days: list[CalendarDay], today: date) -> int:
    if not days:
        return 0
    dates_with_entries = {date.fromisoformat(d.date) for d in days if d.entry_count > 0}
    if today not in dates_with_entries:
        today = today - timedelta(days=1)
        if today not in dates_with_entries:
            return 0
    streak = 0
    current = today
    while current in dates_with_entries:
        streak += 1
        current -= timedelta(days=1)
    return streak
