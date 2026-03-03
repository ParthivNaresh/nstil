from typing import Annotated
from unittest.mock import AsyncMock

from fastapi import Depends
from fastapi.testclient import TestClient

from nstil.api.deps import get_current_user
from nstil.models import UserPayload
from tests.factories import DEFAULT_SESSION_ID, make_token


def _add_protected_route(client: TestClient) -> None:
    @client.app.get("/test/protected")  # type: ignore[union-attr]
    def protected(
        user: Annotated[UserPayload, Depends(get_current_user)],
    ) -> dict[str, str]:
        return {"sub": user.sub}


def _auth_headers(token: str | None = None) -> dict[str, str]:
    return {"Authorization": f"Bearer {token or make_token()}"}


class TestAuthDependency:
    def test_valid_token(self, client: TestClient) -> None:
        _add_protected_route(client)
        token = make_token()
        response = client.get(
            "/test/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert "sub" in response.json()

    def test_expired_token(self, client: TestClient) -> None:
        _add_protected_route(client)
        token = make_token(exp=0)
        response = client.get(
            "/test/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    def test_invalid_token(self, client: TestClient) -> None:
        _add_protected_route(client)
        response = client.get(
            "/test/protected",
            headers={"Authorization": "Bearer garbage"},
        )
        assert response.status_code == 401

    def test_missing_auth_header(self, client: TestClient) -> None:
        _add_protected_route(client)
        response = client.get("/test/protected")
        assert response.status_code in (401, 403)

    def test_empty_bearer(self, client: TestClient) -> None:
        _add_protected_route(client)
        response = client.get(
            "/test/protected",
            headers={"Authorization": "Bearer "},
        )
        assert response.status_code in (401, 403)


class TestTokenRevocation:
    def test_revoked_token_rejected(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        _add_protected_route(client)
        mock_token_blacklist.is_revoked.return_value = True

        response = client.get(
            "/test/protected",
            headers=_auth_headers(),
        )
        assert response.status_code == 401
        assert "revoked" in response.json()["detail"].lower()
        mock_token_blacklist.is_revoked.assert_called_once_with(DEFAULT_SESSION_ID)

    def test_non_revoked_token_allowed(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        _add_protected_route(client)
        mock_token_blacklist.is_revoked.return_value = False

        response = client.get(
            "/test/protected",
            headers=_auth_headers(),
        )
        assert response.status_code == 200

    def test_token_without_session_id_skips_check(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        _add_protected_route(client)
        token = make_token(session_id=None)

        response = client.get(
            "/test/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        mock_token_blacklist.is_revoked.assert_not_called()


class TestSignOutEndpoint:
    def test_sign_out_returns_204(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        response = client.post(
            "/api/v1/auth/sign-out",
            headers=_auth_headers(),
        )
        assert response.status_code == 204

    def test_sign_out_revokes_session(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        response = client.post(
            "/api/v1/auth/sign-out",
            headers=_auth_headers(),
        )
        assert response.status_code == 204
        mock_token_blacklist.revoke.assert_called_once()
        call_args = mock_token_blacklist.revoke.call_args
        assert call_args[0][0] == DEFAULT_SESSION_ID
        assert isinstance(call_args[0][1], int)
        assert call_args[0][1] > 0

    def test_sign_out_without_session_id_still_succeeds(
        self,
        client: TestClient,
        mock_token_blacklist: AsyncMock,
    ) -> None:
        token = make_token(session_id=None)
        response = client.post(
            "/api/v1/auth/sign-out",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 204
        mock_token_blacklist.revoke.assert_not_called()

    def test_sign_out_requires_auth(self, client: TestClient) -> None:
        response = client.post("/api/v1/auth/sign-out")
        assert response.status_code in (401, 403)

    def test_sign_out_with_expired_token(self, client: TestClient) -> None:
        token = make_token(exp=0)
        response = client.post(
            "/api/v1/auth/sign-out",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
