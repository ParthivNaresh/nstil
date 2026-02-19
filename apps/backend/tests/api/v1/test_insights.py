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

    def test_list_with_source_filter(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        mock_ai_insight_service.list_insights.return_value = ([], False)

        response = client.get(
            INSIGHTS_URL,
            params={"source": "on_device_llm"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        call_kwargs = mock_ai_insight_service.list_insights.call_args
        assert call_kwargs.kwargs["source"] == "on_device_llm"

    def test_list_with_combined_filters(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        mock_ai_insight_service.list_insights.return_value = ([], False)

        response = client.get(
            INSIGHTS_URL,
            params={
                "type": "weekly_summary",
                "source": "computed",
                "status": "generated",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        call_kwargs = mock_ai_insight_service.list_insights.call_args
        assert call_kwargs.kwargs["insight_type"] == "weekly_summary"
        assert call_kwargs.kwargs["source"] == "computed"
        assert call_kwargs.kwargs["status"] == "generated"

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


class TestCreateInsight:
    def test_create_on_device_llm_success(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        row = make_ai_insight_row(source="on_device_llm")
        mock_ai_insight_service.create.return_value = row

        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "weekly_summary",
                "title": "Week of Feb 10",
                "content": "A warm narrative about your week.",
                "source": "on_device_llm",
                "period_start": "2026-02-10",
                "period_end": "2026-02-16",
                "metadata": {"entry_count": 5},
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["source"] == "on_device_llm"
        mock_ai_insight_service.create.assert_called_once()

    def test_create_cloud_llm_success(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        row = make_ai_insight_row(source="cloud_llm")
        mock_ai_insight_service.create.return_value = row

        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "pattern",
                "title": "Mood pattern detected",
                "content": "You tend to feel calmer on weekends.",
                "source": "cloud_llm",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201

    def test_create_computed_source_rejected(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "weekly_summary",
                "title": "Week of Feb 10",
                "content": "Some content.",
                "source": "computed",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422
        mock_ai_insight_service.create.assert_not_called()

    def test_create_missing_required_fields(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        response = client.post(
            INSIGHTS_URL,
            json={"insight_type": "weekly_summary"},
            headers=_auth_headers(),
        )

        assert response.status_code == 422
        mock_ai_insight_service.create.assert_not_called()

    def test_create_empty_title_rejected(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "weekly_summary",
                "title": "",
                "content": "Some content.",
                "source": "on_device_llm",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 422
        mock_ai_insight_service.create.assert_not_called()

    def test_create_with_supporting_entry_ids(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        row = make_ai_insight_row(source="on_device_llm")
        mock_ai_insight_service.create.return_value = row

        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "weekly_summary",
                "title": "Week summary",
                "content": "Narrative content.",
                "source": "on_device_llm",
                "supporting_entry_ids": [
                    "00000000-0000-0000-0000-000000000001",
                    "00000000-0000-0000-0000-000000000002",
                ],
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201

    def test_create_unauthenticated(
        self, client: TestClient, mock_ai_insight_service: AsyncMock
    ) -> None:
        response = client.post(
            INSIGHTS_URL,
            json={
                "insight_type": "weekly_summary",
                "title": "Week of Feb 10",
                "content": "Some content.",
                "source": "on_device_llm",
            },
        )

        assert response.status_code == 401
        mock_ai_insight_service.create.assert_not_called()


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
