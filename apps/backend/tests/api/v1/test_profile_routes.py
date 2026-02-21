from datetime import UTC, datetime
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import DEFAULT_USER_ID, make_profile_row, make_token

PROFILE_URL = "/api/v1/profile"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestGetProfile:
    def test_success(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        row = make_profile_row(display_name="Parthiv")
        mock_profile_service.get.return_value = row

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
        mock_profile_service.get.return_value = row

        response = client.get(PROFILE_URL, headers=_auth_headers())

        assert response.status_code == 200
        assert response.json()["onboarding_completed_at"] is not None

    def test_not_found(self, client: TestClient, mock_profile_service: AsyncMock) -> None:
        mock_profile_service.get.return_value = None

        response = client.get(PROFILE_URL, headers=_auth_headers())

        assert response.status_code == 404

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

    def test_clear_display_name(
        self, client: TestClient, mock_profile_service: AsyncMock
    ) -> None:
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
