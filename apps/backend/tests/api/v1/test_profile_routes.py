from datetime import UTC, datetime
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from nstil.core.exceptions import ProfileCreationError
from tests.factories import (
    DEFAULT_USER_ID,
    make_custom_theme_payload,
    make_profile_row,
    make_token,
)

PROFILE_URL = "/api/v1/profile"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestGetProfile:
    def test_success(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        row = make_profile_row(display_name="Parthiv")
        mock_profile_service.ensure.return_value = row

        response = client.get(PROFILE_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Parthiv"
        assert data["onboarding_completed_at"] is None

    def test_with_onboarding_completed(
        self, client: TestClient, mock_profile_service: AsyncMock
    ) -> None:
        now = datetime.now(UTC)
        row = make_profile_row(display_name="Parthiv", onboarding_completed_at=now)
        mock_profile_service.ensure.return_value = row

        response = client.get(PROFILE_URL, headers=_auth_headers())

        assert response.status_code == 200
        assert response.json()["onboarding_completed_at"] is not None

    def test_not_found(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        mock_profile_service.ensure.side_effect = ProfileCreationError("not found")

        response = client.get(PROFILE_URL, headers=_auth_headers())

        assert response.status_code == 422

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.get(PROFILE_URL)

        assert response.status_code == 401


class TestUpdateProfile:
    def test_success(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        row = make_profile_row(display_name="Updated")
        mock_profile_service.update.return_value = row

        response = client.patch(
            PROFILE_URL,
            json={"display_name": "Updated"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["display_name"] == "Updated"

    def test_clear_display_name(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        row = make_profile_row(display_name=None)
        mock_profile_service.update.return_value = row

        response = client.patch(
            PROFILE_URL,
            json={"display_name": None},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["display_name"] is None

    def test_not_found(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        mock_profile_service.update.return_value = None

        response = client.patch(
            PROFILE_URL,
            json={"display_name": "Test"},
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_empty_body_rejected(self, client: TestClient) -> None:
        response = client.patch(
            PROFILE_URL,
            json={},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_display_name_too_long_rejected(self, client: TestClient) -> None:
        response = client.patch(
            PROFILE_URL,
            json={"display_name": "x" * 101},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_update_theme_mode(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        row = make_profile_row(theme_mode="sunset")
        mock_profile_service.update.return_value = row

        response = client.patch(
            PROFILE_URL,
            json={"theme_mode": "sunset"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["theme_mode"] == "sunset"

    def test_update_theme_mode_invalid(self, client: TestClient) -> None:
        response = client.patch(
            PROFILE_URL,
            json={"theme_mode": "neon"},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_update_custom_themes(
        self, client: TestClient, mock_profile_service: AsyncMock
    ) -> None:
        theme = make_custom_theme_payload()
        row = make_profile_row(theme_mode="custom", active_custom_theme_id="custom_test_001")
        mock_profile_service.update.return_value = row

        response = client.patch(
            PROFILE_URL,
            json={"custom_themes": [theme]},
            headers=_auth_headers(),
        )

        assert response.status_code == 200

    def test_update_custom_themes_exceeds_max(self, client: TestClient) -> None:
        themes = [make_custom_theme_payload(theme_id=f"t{i}") for i in range(5)]

        response = client.patch(
            PROFILE_URL,
            json={"custom_themes": themes},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_update_all_theme_fields(
        self, client: TestClient, mock_profile_service: AsyncMock
    ) -> None:
        theme = make_custom_theme_payload()
        row = make_profile_row(
            theme_mode="custom",
            active_custom_theme_id="custom_test_001",
        )
        mock_profile_service.update.return_value = row

        response = client.patch(
            PROFILE_URL,
            json={
                "theme_mode": "custom",
                "custom_themes": [theme],
                "active_custom_theme_id": "custom_test_001",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["theme_mode"] == "custom"
        assert data["active_custom_theme_id"] == "custom_test_001"


class TestCompleteOnboarding:
    def test_success(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        now = datetime.now(UTC)
        row = make_profile_row(onboarding_completed_at=now)
        mock_profile_service.complete_onboarding.return_value = row

        response = client.post(
            f"{PROFILE_URL}/onboarding-complete",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["onboarding_completed_at"] is not None

    def test_not_found(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        mock_profile_service.complete_onboarding.return_value = None

        response = client.post(
            f"{PROFILE_URL}/onboarding-complete",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.post(f"{PROFILE_URL}/onboarding-complete")

        assert response.status_code == 401
