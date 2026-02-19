from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from nstil.services.ai.check_in import CheckInError, CheckInResult
from tests.factories import (
    DEFAULT_USER_ID,
    make_ai_session_row,
    make_entry_row,
    make_token,
)

CHECK_IN_URL = "/api/v1/check-in"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestStartCheckIn:
    def test_start_success(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.start.return_value = CheckInResult(
            session=session, prompt_content="How are you feeling?"
        )

        response = client.post(
            f"{CHECK_IN_URL}/start",
            json={"trigger_source": "manual"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["session"]["id"] == str(session.id)
        assert data["prompt_content"] == "How are you feeling?"
        assert data["entry"] is None

    def test_start_default_trigger(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.start.return_value = CheckInResult(session=session)

        response = client.post(
            f"{CHECK_IN_URL}/start",
            json={},
            headers=_auth_headers(),
        )

        assert response.status_code == 201

    def test_start_error_returns_422(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        mock_check_in_orchestrator.start.side_effect = CheckInError(
            "Failed to generate check-in prompt"
        )

        response = client.post(
            f"{CHECK_IN_URL}/start",
            json={},
            headers=_auth_headers(),
        )

        assert response.status_code == 422
        assert "Failed to generate" in response.json()["detail"]

    def test_start_unauthenticated(self, client: TestClient) -> None:
        response = client.post(f"{CHECK_IN_URL}/start", json={})
        assert response.status_code == 401


class TestRespondCheckIn:
    def test_respond_success(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.respond.return_value = CheckInResult(session=session)

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/respond",
            json={"mood_category": "happy", "response_text": "Feeling great"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["session"]["id"] == str(session.id)

    def test_respond_with_mood_specific(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.respond.return_value = CheckInResult(session=session)

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/respond",
            json={
                "mood_category": "happy",
                "mood_specific": "grateful",
                "response_text": "Thankful today",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 200

    def test_respond_error_returns_422(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.respond.side_effect = CheckInError(
            "Cannot respond: session is in step 'completed'"
        )

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/respond",
            json={"mood_category": "calm"},
            headers=_auth_headers(),
        )

        assert response.status_code == 422


class TestConvertCheckIn:
    def test_convert_success(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row()
        entry = make_entry_row()
        mock_check_in_orchestrator.convert_to_entry.return_value = CheckInResult(
            session=session, entry=entry
        )

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/convert",
            json={"title": "My check-in"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["session"]["id"] == str(session.id)
        assert data["entry"] is not None
        assert data["entry"]["id"] == str(entry.id)


class TestCompleteCheckIn:
    def test_complete_success(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row(status="completed")
        mock_check_in_orchestrator.complete.return_value = CheckInResult(session=session)

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/complete",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["session"]["status"] == "completed"


class TestAbandonCheckIn:
    def test_abandon_success(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        session = make_ai_session_row(status="abandoned")
        mock_check_in_orchestrator.abandon.return_value = CheckInResult(session=session)

        response = client.post(
            f"{CHECK_IN_URL}/{session.id}/abandon",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["session"]["status"] == "abandoned"


class TestGetActiveCheckIn:
    def test_active_found(self, client: TestClient, mock_check_in_orchestrator: AsyncMock) -> None:
        session = make_ai_session_row()
        mock_check_in_orchestrator.get_active.return_value = CheckInResult(
            session=session, prompt_content="How are you?"
        )

        response = client.get(
            f"{CHECK_IN_URL}/active",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["session"]["id"] == str(session.id)
        assert data["prompt_content"] == "How are you?"

    def test_no_active_returns_404(
        self, client: TestClient, mock_check_in_orchestrator: AsyncMock
    ) -> None:
        mock_check_in_orchestrator.get_active.return_value = None

        response = client.get(
            f"{CHECK_IN_URL}/active",
            headers=_auth_headers(),
        )

        assert response.status_code == 404
