from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from nstil.models.calendar import CalendarDay
from tests.factories import DEFAULT_USER_ID, make_token

CALENDAR_URL = "/api/v1/entries/calendar"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestGetCalendar:
    def test_returns_days(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        days = [
            CalendarDay(
                date="2026-02-01",
                mood_category="happy",
                mood_specific="grateful",
                entry_count=2,
            ),
            CalendarDay(
                date="2026-02-14",
                mood_category="calm",
                mood_specific=None,
                entry_count=1,
            ),
        ]
        mock_journal_service.get_calendar.return_value = days

        response = client.get(
            CALENDAR_URL,
            params={"year": 2026, "month": 2},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2026
        assert data["month"] == 2
        assert len(data["days"]) == 2
        assert data["days"][0]["date"] == "2026-02-01"
        assert data["days"][0]["mood_category"] == "happy"
        assert data["days"][0]["entry_count"] == 2
        assert data["days"][1]["date"] == "2026-02-14"
        assert data["total_entries"] == 3

    def test_empty_month(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.get_calendar.return_value = []

        response = client.get(
            CALENDAR_URL,
            params={"year": 2026, "month": 1},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["days"] == []
        assert data["total_entries"] == 0
        assert data["streak"] == 0

    def test_invalid_month(self, client: TestClient) -> None:
        response = client.get(
            CALENDAR_URL,
            params={"year": 2026, "month": 13},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_invalid_year(self, client: TestClient) -> None:
        response = client.get(
            CALENDAR_URL,
            params={"year": 2019, "month": 1},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_missing_params(self, client: TestClient) -> None:
        response = client.get(
            CALENDAR_URL,
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_requires_auth(self, client: TestClient) -> None:
        response = client.get(
            CALENDAR_URL,
            params={"year": 2026, "month": 2},
        )
        assert response.status_code in (401, 403)

    def test_passes_user_id(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        custom_user = "11111111-1111-1111-1111-111111111111"
        mock_journal_service.get_calendar.return_value = []

        response = client.get(
            CALENDAR_URL,
            params={"year": 2026, "month": 2},
            headers=_auth_headers(sub=custom_user),
        )

        assert response.status_code == 200
        call_args = mock_journal_service.get_calendar.call_args
        assert str(call_args[0][0]) == custom_user
