from datetime import datetime, time
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class ReminderFrequency(StrEnum):
    DAILY = "daily"
    TWICE_DAILY = "twice_daily"
    WEEKDAYS = "weekdays"
    CUSTOM = "custom"


VALID_DAYS = frozenset(range(7))
MAX_REMINDER_TIMES = 5


class ReminderTime(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(..., ge=0, le=59)


class NotificationPreferencesRow(BaseModel):
    user_id: UUID
    reminders_enabled: bool
    frequency: str
    reminder_times: list[ReminderTime]
    active_days: list[int]
    quiet_hours_start: time | None
    quiet_hours_end: time | None
    last_notified_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"extra": "ignore"}


NULLABLE_FIELDS: frozenset[str] = frozenset({"quiet_hours_start", "quiet_hours_end"})


class NotificationPreferencesUpdate(BaseModel):
    reminders_enabled: bool | None = Field(default=None)
    frequency: ReminderFrequency | None = Field(default=None)
    reminder_times: list[ReminderTime] | None = Field(default=None)
    active_days: list[int] | None = Field(default=None)
    quiet_hours_start: time | None = Field(default=None)
    quiet_hours_end: time | None = Field(default=None)

    @model_validator(mode="after")
    def validate_fields(self) -> "NotificationPreferencesUpdate":
        if not self.model_fields_set:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        quiet_start_set = "quiet_hours_start" in self.model_fields_set
        quiet_end_set = "quiet_hours_end" in self.model_fields_set
        if quiet_start_set != quiet_end_set:
            msg = "quiet_hours_start and quiet_hours_end must both be provided or both be omitted"
            raise ValueError(msg)
        return self

    @field_validator("reminder_times")
    @classmethod
    def validate_reminder_times(cls, v: list[ReminderTime] | None) -> list[ReminderTime] | None:
        if v is None:
            return None
        if not v:
            msg = "At least one reminder time is required"
            raise ValueError(msg)
        if len(v) > MAX_REMINDER_TIMES:
            msg = f"Maximum {MAX_REMINDER_TIMES} reminder times allowed"
            raise ValueError(msg)
        return v

    @field_validator("active_days")
    @classmethod
    def validate_active_days(cls, v: list[int] | None) -> list[int] | None:
        if v is None:
            return None
        if not all(d in VALID_DAYS for d in v):
            msg = "Active days must be integers 0-6 (Sunday-Saturday)"
            raise ValueError(msg)
        return sorted(set(v))

    def to_update_dict(self) -> dict[str, object]:
        result: dict[str, object] = {}
        for k, v in self.model_dump(mode="json").items():
            if k not in self.model_fields_set:
                continue
            result[k] = v
        return result


class NotificationPreferencesResponse(BaseModel):
    user_id: UUID
    reminders_enabled: bool
    frequency: str
    reminder_times: list[ReminderTime]
    active_days: list[int]
    quiet_hours_start: time | None
    quiet_hours_end: time | None
    last_notified_at: datetime | None
    updated_at: datetime

    @classmethod
    def from_row(cls, row: NotificationPreferencesRow) -> "NotificationPreferencesResponse":
        return cls(
            user_id=row.user_id,
            reminders_enabled=row.reminders_enabled,
            frequency=row.frequency,
            reminder_times=row.reminder_times,
            active_days=row.active_days,
            quiet_hours_start=row.quiet_hours_start,
            quiet_hours_end=row.quiet_hours_end,
            last_notified_at=row.last_notified_at,
            updated_at=row.updated_at,
        )
