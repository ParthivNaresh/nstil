from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from nstil.models.ai_context import (
    AIContextProfile,
    AIContextResponse,
    AIContextStats,
)
from tests.factories import DEFAULT_USER_ID, make_ai_prompt_row, make_token

AI_URL = "/api/v1/ai"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


def _make_context() -> AIContextResponse:
    return AIContextResponse(
        recent_entries=[],
        mood_distribution=[],
        recent_prompts=[],
        recent_sessions=[],
        stats=AIContextStats(
            total_entries=5,
            entries_last_7d=2,
            check_ins_total=0,
            check_ins_last_7d=0,
            avg_entry_length_7d=100,
            last_entry_at=None,
        ),
        profile=AIContextProfile(
            prompt_style="gentle",
            topics_to_avoid=[],
            goals=[],
        ),
    )


class TestGetContext:
    def test_success_defaults(
        self, client: TestClient, mock_ai_context_service: AsyncMock
    ) -> None:
        ctx = _make_context()
        mock_ai_context_service.get_context.return_value = ctx

        response = client.get(f"{AI_URL}/context", headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["stats"]["total_entries"] == 5
        assert data["recent_entries"] == []

    def test_custom_params(
        self, client: TestClient, mock_ai_context_service: AsyncMock
    ) -> None:
        ctx = _make_context()
        mock_ai_context_service.get_context.return_value = ctx

        response = client.get(
            f"{AI_URL}/context",
            params={"entry_limit": 50, "days_back": 30},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        call_args = mock_ai_context_service.get_context.call_args
        assert call_args.kwargs["entry_limit"] == 50
        assert call_args.kwargs["days_back"] == 30


class TestListPrompts:
    def test_success(
        self, client: TestClient, mock_ai_prompt_service: AsyncMock
    ) -> None:
        rows = [make_ai_prompt_row(), make_ai_prompt_row()]
        mock_ai_prompt_service.list_prompts.return_value = (rows, False)

        response = client.get(f"{AI_URL}/prompts", headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["has_more"] is False

    def test_with_type_filter(
        self, client: TestClient, mock_ai_prompt_service: AsyncMock
    ) -> None:
        mock_ai_prompt_service.list_prompts.return_value = ([], False)

        response = client.get(
            f"{AI_URL}/prompts",
            params={"type": "check_in"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        call_kwargs = mock_ai_prompt_service.list_prompts.call_args
        assert call_kwargs.kwargs["prompt_type"] == "check_in"

    def test_with_pagination(
        self, client: TestClient, mock_ai_prompt_service: AsyncMock
    ) -> None:
        rows = [make_ai_prompt_row()]
        mock_ai_prompt_service.list_prompts.return_value = (rows, True)

        response = client.get(
            f"{AI_URL}/prompts",
            params={"limit": 1},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_more"] is True
        assert data["next_cursor"] is not None


class TestGeneratePrompt:
    def test_success(
        self, client: TestClient, mock_prompt_engine: AsyncMock
    ) -> None:
        row = make_ai_prompt_row(
            prompt_type="check_in", content="How are you feeling?"
        )
        mock_prompt_engine.generate.return_value = row

        response = client.post(
            f"{AI_URL}/prompts/generate",
            json={"prompt_type": "check_in"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["prompt_type"] == "check_in"
        assert data["content"] == "How are you feeling?"

    def test_no_prompt_available_returns_422(
        self, client: TestClient, mock_prompt_engine: AsyncMock
    ) -> None:
        mock_prompt_engine.generate.return_value = None

        response = client.post(
            f"{AI_URL}/prompts/generate",
            json={},
            headers=_auth_headers(),
        )

        assert response.status_code == 422


class TestUpdatePrompt:
    def test_success(
        self, client: TestClient, mock_ai_prompt_service: AsyncMock
    ) -> None:
        row = make_ai_prompt_row(status="seen")
        mock_ai_prompt_service.update.return_value = row

        response = client.patch(
            f"{AI_URL}/prompts/{row.id}",
            json={"status": "seen"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "seen"

    def test_not_found(
        self, client: TestClient, mock_ai_prompt_service: AsyncMock
    ) -> None:
        mock_ai_prompt_service.update.return_value = None

        response = client.patch(
            f"{AI_URL}/prompts/00000000-0000-0000-0000-000000000099",
            json={"status": "dismissed"},
            headers=_auth_headers(),
        )

        assert response.status_code == 404
