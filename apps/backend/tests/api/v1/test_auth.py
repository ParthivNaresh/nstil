from typing import Annotated

from fastapi import Depends
from fastapi.testclient import TestClient

from nstil.api.deps import get_current_user
from nstil.models import UserPayload
from tests.factories import make_token


def _add_protected_route(client: TestClient) -> None:
    @client.app.get("/test/protected")  # type: ignore[union-attr]
    def protected(
        user: Annotated[UserPayload, Depends(get_current_user)],
    ) -> dict[str, str]:
        return {"sub": user.sub}


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
        # HTTPBearer returns 401 when credentials are missing
        assert response.status_code in (401, 403)

    def test_empty_bearer(self, client: TestClient) -> None:
        _add_protected_route(client)
        response = client.get(
            "/test/protected",
            headers={"Authorization": "Bearer "},
        )
        # HTTPBearer returns 401 when credentials are empty
        assert response.status_code in (401, 403)
