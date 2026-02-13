from typing import Annotated

from fastapi import Depends
from fastapi.testclient import TestClient

from nstil.api.deps import get_current_user
from nstil.models import UserPayload
from tests.factories import make_token


def _add_protected_route(client: TestClient) -> None:
    @client.app.get("/test/cache-protected")  # type: ignore[union-attr]
    def cache_protected(
        user: Annotated[UserPayload, Depends(get_current_user)],
    ) -> dict[str, str]:
        return {"sub": user.sub}


class TestCacheControlMiddleware:
    def test_authenticated_endpoint_has_no_store(self, client: TestClient) -> None:
        _add_protected_route(client)
        token = make_token()
        response = client.get(
            "/test/cache-protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.headers["Cache-Control"] == "no-store, private"
        assert response.headers["Pragma"] == "no-cache"

    def test_health_endpoint_has_no_cache_headers(self, client: TestClient) -> None:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert "Cache-Control" not in response.headers
        assert "Pragma" not in response.headers
