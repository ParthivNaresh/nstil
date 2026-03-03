from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import (
    DEFAULT_USER_ID,
    make_ai_profile_row,
    make_notification_prefs_row,
    make_token,
)

AI_URL = "/api/v1/ai"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestGetProfile:
    def test_success(self, client: TestClient, mock_ai_profile_service: AsyncMock) -> None:
        row = make_ai_profile_row(prompt_style="direct", topics_to_avoid=["work"])
        mock_ai_profile_service.get_or_create.return_value = row

        response = client.get(f"{AI_URL}/profile", headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["prompt_style"] == "direct"
        assert data["topics_to_avoid"] == ["work"]
        assert data["ai_enabled"] is True

    def test_not_found(self, client: TestClient, mock_ai_profile_service: AsyncMock) -> None:
        mock_ai_profile_service.get_or_create.return_value = None

        response = client.get(f"{AI_URL}/profile", headers=_auth_headers())

        assert response.status_code == 404


class TestUpdateProfile:
    def test_success(self, client: TestClient, mock_ai_profile_service: AsyncMock) -> None:
        row = make_ai_profile_row(prompt_style="analytical")
        mock_ai_profile_service.update.return_value = row

        response = client.patch(
            f"{AI_URL}/profile",
            json={"prompt_style": "analytical"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["prompt_style"] == "analytical"

    def test_invalid_style_rejected(self, client: TestClient) -> None:
        response = client.patch(
            f"{AI_URL}/profile",
            json={"prompt_style": "poetic"},
            headers=_auth_headers(),
        )

        assert response.status_code == 422


class TestGetNotifications:
    def test_success(self, client: TestClient, mock_notification_service: AsyncMock) -> None:
        row = make_notification_prefs_row(frequency="twice_daily")
        mock_notification_service.get_or_create.return_value = row

        response = client.get(f"{AI_URL}/notifications", headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["frequency"] == "twice_daily"
        assert data["reminders_enabled"] is True

    def test_not_found(self, client: TestClient, mock_notification_service: AsyncMock) -> None:
        mock_notification_service.get_or_create.return_value = None

        response = client.get(f"{AI_URL}/notifications", headers=_auth_headers())

        assert response.status_code == 404


class TestUpdateNotifications:
    def test_success(self, client: TestClient, mock_notification_service: AsyncMock) -> None:
        row = make_notification_prefs_row(reminders_enabled=False)
        mock_notification_service.update.return_value = row

        response = client.patch(
            f"{AI_URL}/notifications",
            json={"reminders_enabled": False},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["reminders_enabled"] is False
