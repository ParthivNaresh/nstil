from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import (
    DEFAULT_USER_ID,
    make_breathing_session_row,
    make_breathing_stats,
    make_token,
)

BASE_URL = "/api/v1/breathing"
SESSIONS_URL = f"{BASE_URL}/sessions"
STATS_URL = f"{BASE_URL}/stats"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestCreateSession:
    def test_success(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        row = make_breathing_session_row(pattern="box", duration_seconds=120, cycles_target=4)
        mock_breathing_service.create.return_value = row

        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 120,
                "cycles_target": 4,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["pattern"] == "box"
        assert data["duration_seconds"] == 120
        assert data["cycles_target"] == 4
        assert data["cycles_completed"] == 0
        assert data["completed"] is False

    def test_with_mood_before(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        row = make_breathing_session_row(
            pattern="478", mood_before="anxious", duration_seconds=60, cycles_target=3
        )
        mock_breathing_service.create.return_value = row

        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "478",
                "duration_seconds": 60,
                "cycles_target": 3,
                "mood_before": "anxious",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        assert response.json()["mood_before"] == "anxious"

    def test_invalid_pattern_rejected(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "invalid",
                "duration_seconds": 120,
                "cycles_target": 4,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_duration_zero_rejected(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 0,
                "cycles_target": 4,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_duration_exceeds_max_rejected(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 601,
                "cycles_target": 4,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_cycles_target_zero_rejected(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 120,
                "cycles_target": 0,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_invalid_mood_rejected(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 120,
                "cycles_target": 4,
                "mood_before": "invalid_mood",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.post(
            SESSIONS_URL,
            json={
                "pattern": "box",
                "duration_seconds": 120,
                "cycles_target": 4,
            },
        )

        assert response.status_code == 401


class TestUpdateSession:
    def test_complete_session(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        row = make_breathing_session_row(completed=True, cycles_completed=4, mood_after="calm")
        mock_breathing_service.complete.return_value = row

        response = client.patch(
            f"{SESSIONS_URL}/{row.id}",
            json={
                "cycles_completed": 4,
                "mood_after": "calm",
                "completed": True,
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
        assert data["cycles_completed"] == 4
        assert data["mood_after"] == "calm"

    def test_partial_update(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        row = make_breathing_session_row(completed=True)
        mock_breathing_service.complete.return_value = row

        response = client.patch(
            f"{SESSIONS_URL}/{row.id}",
            json={"completed": True},
            headers=_auth_headers(),
        )

        assert response.status_code == 200

    def test_not_found(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        mock_breathing_service.complete.return_value = None

        response = client.patch(
            f"{SESSIONS_URL}/00000000-0000-0000-0000-000000000099",
            json={"completed": True},
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_empty_body_rejected(self, client: TestClient) -> None:
        response = client.patch(
            f"{SESSIONS_URL}/00000000-0000-0000-0000-000000000099",
            json={},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_invalid_mood_after_rejected(self, client: TestClient) -> None:
        response = client.patch(
            f"{SESSIONS_URL}/00000000-0000-0000-0000-000000000099",
            json={"mood_after": "invalid_mood"},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.patch(
            f"{SESSIONS_URL}/00000000-0000-0000-0000-000000000099",
            json={"completed": True},
        )

        assert response.status_code == 401


class TestGetStats:
    def test_success(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        stats = make_breathing_stats(
            total_sessions=10,
            completed_sessions=8,
            total_minutes=45,
            sessions_this_week=3,
        )
        mock_breathing_service.get_stats.return_value = stats

        response = client.get(STATS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["total_sessions"] == 10
        assert data["completed_sessions"] == 8
        assert data["total_minutes"] == 45
        assert data["sessions_this_week"] == 3

    def test_empty_stats(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        stats = make_breathing_stats()
        mock_breathing_service.get_stats.return_value = stats

        response = client.get(STATS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["total_sessions"] == 0
        assert data["completed_sessions"] == 0
        assert data["total_minutes"] == 0
        assert data["sessions_this_week"] == 0

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.get(STATS_URL)

        assert response.status_code == 401


class TestListSessions:
    def test_success(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        rows = [make_breathing_session_row() for _ in range(3)]
        mock_breathing_service.list_recent.return_value = (rows, False)

        response = client.get(SESSIONS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["has_more"] is False
        assert data["next_cursor"] is None

    def test_with_pagination(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        rows = [make_breathing_session_row() for _ in range(2)]
        mock_breathing_service.list_recent.return_value = (rows, True)

        response = client.get(SESSIONS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["has_more"] is True
        assert data["next_cursor"] is not None

    def test_with_cursor_param(
        self, client: TestClient, mock_breathing_service: AsyncMock
    ) -> None:
        mock_breathing_service.list_recent.return_value = ([], False)

        response = client.get(
            SESSIONS_URL,
            params={"cursor": "2025-01-01T00:00:00+00:00", "limit": 10},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["has_more"] is False

    def test_limit_validation(self, client: TestClient) -> None:
        response = client.get(
            SESSIONS_URL,
            params={"limit": 0},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_limit_exceeds_max(self, client: TestClient) -> None:
        response = client.get(
            SESSIONS_URL,
            params={"limit": 51},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_empty_list(self, client: TestClient, mock_breathing_service: AsyncMock) -> None:
        mock_breathing_service.list_recent.return_value = ([], False)

        response = client.get(SESSIONS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["has_more"] is False
        assert data["next_cursor"] is None

    def test_unauthenticated(self, client: TestClient) -> None:
        response = client.get(SESSIONS_URL)

        assert response.status_code == 401
