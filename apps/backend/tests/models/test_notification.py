from datetime import time

import pytest
from pydantic import ValidationError

from nstil.models.notification import (
    MAX_REMINDER_TIMES,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    ReminderFrequency,
    ReminderTime,
)
from tests.factories import make_notification_prefs_row


class TestReminderTime:
    def test_valid(self) -> None:
        rt = ReminderTime(hour=9, minute=30)
        assert rt.hour == 9
        assert rt.minute == 30

    def test_boundary_values(self) -> None:
        ReminderTime(hour=0, minute=0)
        ReminderTime(hour=23, minute=59)

    def test_hour_too_high_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ReminderTime(hour=24, minute=0)

    def test_minute_too_high_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ReminderTime(hour=0, minute=60)

    def test_negative_hour_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ReminderTime(hour=-1, minute=0)


class TestNotificationPreferencesUpdate:
    def test_single_field(self) -> None:
        update = NotificationPreferencesUpdate(reminders_enabled=False)
        assert update.reminders_enabled is False

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            NotificationPreferencesUpdate()

    def test_frequency_accepted(self) -> None:
        for freq in ReminderFrequency:
            update = NotificationPreferencesUpdate(frequency=freq)
            assert update.frequency == freq

    def test_invalid_frequency_rejected(self) -> None:
        with pytest.raises(ValidationError):
            NotificationPreferencesUpdate(frequency="hourly")

    def test_reminder_times_valid(self) -> None:
        times = [ReminderTime(hour=9, minute=0), ReminderTime(hour=21, minute=0)]
        update = NotificationPreferencesUpdate(reminder_times=times)
        assert len(update.reminder_times) == 2

    def test_reminder_times_empty_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one reminder time"):
            NotificationPreferencesUpdate(reminder_times=[])

    def test_reminder_times_too_many_rejected(self) -> None:
        times = [ReminderTime(hour=i, minute=0) for i in range(MAX_REMINDER_TIMES + 1)]
        with pytest.raises(ValidationError, match=f"Maximum {MAX_REMINDER_TIMES}"):
            NotificationPreferencesUpdate(reminder_times=times)

    def test_active_days_valid(self) -> None:
        update = NotificationPreferencesUpdate(active_days=[0, 1, 2, 3, 4])
        assert update.active_days == [0, 1, 2, 3, 4]

    def test_active_days_deduped_and_sorted(self) -> None:
        update = NotificationPreferencesUpdate(active_days=[5, 2, 2, 0])
        assert update.active_days == [0, 2, 5]

    def test_active_days_invalid_value_rejected(self) -> None:
        with pytest.raises(ValidationError, match="0-6"):
            NotificationPreferencesUpdate(active_days=[7])

    def test_active_days_negative_rejected(self) -> None:
        with pytest.raises(ValidationError, match="0-6"):
            NotificationPreferencesUpdate(active_days=[-1])

    def test_quiet_hours_both_required(self) -> None:
        with pytest.raises(ValidationError, match="both be provided"):
            NotificationPreferencesUpdate(quiet_hours_start=time(22, 0))

    def test_quiet_hours_both_provided_accepted(self) -> None:
        update = NotificationPreferencesUpdate(
            quiet_hours_start=time(22, 0),
            quiet_hours_end=time(7, 0),
        )
        assert update.quiet_hours_start == time(22, 0)
        assert update.quiet_hours_end == time(7, 0)

    def test_to_update_dict_excludes_none(self) -> None:
        update = NotificationPreferencesUpdate(reminders_enabled=True)
        result = update.to_update_dict()
        assert result == {"reminders_enabled": True}
        assert "frequency" not in result
        assert "reminder_times" not in result

    def test_to_update_dict_serializes_times(self) -> None:
        update = NotificationPreferencesUpdate(
            reminder_times=[ReminderTime(hour=9, minute=30)]
        )
        result = update.to_update_dict()
        assert result["reminder_times"] == [{"hour": 9, "minute": 30}]


class TestNotificationPreferencesResponse:
    def test_from_row(self) -> None:
        row = make_notification_prefs_row(
            reminders_enabled=True,
            frequency="daily",
            active_days=[0, 1, 2, 3, 4, 5, 6],
        )
        response = NotificationPreferencesResponse.from_row(row)
        assert response.user_id == row.user_id
        assert response.reminders_enabled is True
        assert response.frequency == "daily"
        assert response.active_days == [0, 1, 2, 3, 4, 5, 6]
        assert response.updated_at == row.updated_at

    def test_from_row_excludes_created_at(self) -> None:
        row = make_notification_prefs_row()
        response = NotificationPreferencesResponse.from_row(row)
        assert not hasattr(response, "created_at")

    def test_from_row_nullable_fields(self) -> None:
        row = make_notification_prefs_row()
        response = NotificationPreferencesResponse.from_row(row)
        assert response.quiet_hours_start is None
        assert response.quiet_hours_end is None
        assert response.last_notified_at is None
