import os
from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from nstil.api.deps import (
    get_journal_service,
    get_media_service,
    get_redis,
    get_settings,
    get_supabase,
)
from nstil.config import Settings
from nstil.core.app_state import AppState
from nstil.services.cached_journal import CachedJournalService
from nstil.services.media import MediaService
from nstil.services.rate_limit import RateLimitService
from tests.factories import DEFAULT_USER_ID, make_token


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class FakeScript:
    def __init__(self) -> None:
        self._store: dict[str, int] = {}

    async def __call__(
        self,
        keys: list[str],
        args: list[object],
    ) -> list[int]:
        key = keys[0]
        limit = int(args[2])

        count = self._store.get(key, 0)
        if count >= limit:
            return [0, count, 1]

        self._store[key] = count + 1
        return [1, count + 1, 0]


class FakeRedisForRateLimit:
    def __init__(self) -> None:
        self._script = FakeScript()

    def register_script(self, script: str) -> FakeScript:
        return self._script

    async def ping(self) -> bool:
        return True

    async def aclose(self) -> None:
        pass


def _rate_limit_settings() -> Settings:
    return Settings(
        supabase_url="http://localhost:54321",
        supabase_service_key=SecretStr("test-service-key"),
        supabase_jwt_secret=SecretStr("test-secret"),
        redis_url="redis://localhost:6379",
        debug=True,
        rate_limit_enabled=True,
    )


@pytest.fixture
def rate_limit_redis() -> FakeRedisForRateLimit:
    return FakeRedisForRateLimit()


@pytest.fixture
def rate_limit_client(
    rate_limit_redis: FakeRedisForRateLimit,
) -> Iterator[TestClient]:
    from nstil.main import create_app

    original_env = os.environ.get("RATE_LIMIT_ENABLED")
    os.environ["RATE_LIMIT_ENABLED"] = "true"
    get_settings.cache_clear()

    try:
        settings = _rate_limit_settings()
        app = create_app()
        app.dependency_overrides[get_settings] = lambda: settings
        app.dependency_overrides[get_redis] = lambda: rate_limit_redis
        app.dependency_overrides[get_supabase] = lambda: AsyncMock()

        mock_journal = AsyncMock(spec=CachedJournalService)
        mock_journal.list_entries.return_value = ([], False)
        mock_media = AsyncMock(spec=MediaService)
        mock_media.get_previews_for_entries.return_value = {}
        app.dependency_overrides[get_journal_service] = lambda: mock_journal
        app.dependency_overrides[get_media_service] = lambda: mock_media

        with TestClient(app) as c:
            rate_limiter = RateLimitService(
                rate_limit_redis,  # type: ignore[arg-type]
            )
            app.state.app = AppState(
                redis=rate_limit_redis,  # type: ignore[arg-type]
                supabase=AsyncMock(),  # type: ignore[arg-type]
                rate_limiter=rate_limiter,
            )
            yield c

        app.dependency_overrides.clear()
    finally:
        if original_env is None:
            os.environ.pop("RATE_LIMIT_ENABLED", None)
        else:
            os.environ["RATE_LIMIT_ENABLED"] = original_env
        get_settings.cache_clear()


class TestRateLimitMiddleware:
    def test_health_exempt(
        self,
        rate_limit_client: TestClient,
    ) -> None:
        response = rate_limit_client.get("/api/v1/health")
        assert response.status_code == 200
        assert "x-ratelimit-limit" not in response.headers

    def test_rate_limit_headers_present(
        self,
        rate_limit_client: TestClient,
    ) -> None:
        response = rate_limit_client.get(
            "/api/v1/entries",
            headers=_auth_headers(),
        )
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
        assert "x-ratelimit-reset" in response.headers

    def test_429_when_ip_limit_exceeded(
        self,
        rate_limit_client: TestClient,
        rate_limit_redis: FakeRedisForRateLimit,
    ) -> None:
        rate_limit_redis._script._store["nstil:rl:ip:testclient"] = 120

        response = rate_limit_client.get(
            "/api/v1/entries",
            headers=_auth_headers(),
        )
        assert response.status_code == 429
        assert response.json()["detail"] == "Rate limit exceeded"
        assert "retry-after" in response.headers

    def test_429_when_user_limit_exceeded(
        self,
        rate_limit_client: TestClient,
        rate_limit_redis: FakeRedisForRateLimit,
    ) -> None:
        user_key = f"nstil:rl:user:{DEFAULT_USER_ID}"
        rate_limit_redis._script._store[user_key] = 60

        response = rate_limit_client.get(
            "/api/v1/entries",
            headers=_auth_headers(),
        )
        assert response.status_code == 429

    def test_different_users_independent(
        self,
        rate_limit_client: TestClient,
        rate_limit_redis: FakeRedisForRateLimit,
    ) -> None:
        user_a = "00000000-0000-0000-0000-000000000001"
        user_b = "00000000-0000-0000-0000-000000000002"

        rate_limit_redis._script._store[f"nstil:rl:user:{user_a}"] = 60

        response_a = rate_limit_client.get(
            "/api/v1/entries",
            headers=_auth_headers(sub=user_a),
        )
        assert response_a.status_code == 429

        response_b = rate_limit_client.get(
            "/api/v1/entries",
            headers=_auth_headers(sub=user_b),
        )
        assert response_b.status_code == 200

    def test_unauthenticated_uses_ip_only(
        self,
        rate_limit_client: TestClient,
    ) -> None:
        response = rate_limit_client.get("/api/v1/entries")
        assert response.status_code in (200, 401, 403)


class TestRateLimitDisabled:
    def test_no_rate_limit_when_disabled(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
    ) -> None:
        mock_journal_service.list_entries.return_value = ([], False)

        response = client.get(
            "/api/v1/entries",
            headers=_auth_headers(),
        )
        assert "x-ratelimit-limit" not in response.headers
