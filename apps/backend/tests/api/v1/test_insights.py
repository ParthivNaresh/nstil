from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import DEFAULT_USER_ID, make_ai_insight_row, make_token

INSIGHTS_URL = "/api/v1/insights"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestListInsights:
    def test_list_success(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        rows = [make_ai_insight_row(), make_ai_insight_row()]
        mock_ai_insight_service.list_insights.return_value = (rows, False)

        response = client.get(INSIGHTS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["has_more"] is False
        assert data["next_cursor"] is None

    def test_list_empty(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        mock_ai_insight_service.list_insights.return_value = ([], False)

        response = client.get(INSIGHTS_URL, headers=_auth_headers())

        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_list_with_type_filter(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        mock_ai_insight_service.list_insights.return_value = ([], False)

        response = client.get(
            INSIGHTS_URL,
            params={"type": "weekly_summary"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        call_kwargs = mock_ai_insight_service.list_insights.call_args
        assert call_kwargs.kwargs["insight_type"] == "weekly_summary"

    def test_list_with_pagination(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        rows = [make_ai_insight_row()]
        mock_ai_insight_service.list_insights.return_value = (rows, True)

        response = client.get(
            INSIGHTS_URL,
            params={"limit": 1},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_more"] is True
        assert data["next_cursor"] is not None


class TestGenerateInsights:
    def test_generate_success(
        self, client: TestClient, mock_insight_engine: AsyncMock
    ) -> None:
        rows = [make_ai_insight_row(), make_ai_insight_row()]
        mock_insight_engine.run.return_value = rows

        response = client.post(
            f"{INSIGHTS_URL}/generate",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_generate_empty(
        self, client: TestClient, mock_insight_engine: AsyncMock
    ) -> None:
        mock_insight_engine.run.return_value = []

        response = client.post(
            f"{INSIGHTS_URL}/generate",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json() == []


class TestUpdateInsight:
    def test_update_success(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        row = make_ai_insight_row(status="seen")
        mock_ai_insight_service.update.return_value = row

        response = client.patch(
            f"{INSIGHTS_URL}/{row.id}",
            json={"status": "seen"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "seen"

    def test_update_not_found(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        mock_ai_insight_service.update.return_value = None

        response = client.patch(
            f"{INSIGHTS_URL}/00000000-0000-0000-0000-000000000099",
            json={"status": "dismissed"},
            headers=_auth_headers(),
        )

        assert response.status_code == 404
