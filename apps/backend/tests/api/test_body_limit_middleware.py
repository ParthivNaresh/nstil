import io
import os
import uuid
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
    get_token_blacklist,
)
from nstil.config import Settings
from nstil.services.cached_journal import CachedJournalService
from nstil.services.media import MediaService
from nstil.services.token_blacklist import TokenBlacklistService
from tests.factories import DEFAULT_USER_ID, make_entry_row, make_media_row, make_token

ENTRY_ID = str(uuid.uuid4())
MEDIA_URL = f"/api/v1/entries/{ENTRY_ID}/media"

_SMALL_BODY_LIMIT = 1024


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


def _body_limit_settings() -> Settings:
    return Settings(
        supabase_url="http://localhost:54321",
        supabase_service_key=SecretStr("test-service-key"),
        supabase_jwt_secret=SecretStr("test-secret"),
        redis_url="redis://localhost:6379",
        debug=True,
        rate_limit_enabled=False,
        max_request_body_bytes=_SMALL_BODY_LIMIT,
    )


@pytest.fixture
def body_limit_client() -> Iterator[TestClient]:
    from nstil.main import create_app

    original_env = os.environ.get("MAX_REQUEST_BODY_BYTES")
    os.environ["MAX_REQUEST_BODY_BYTES"] = str(_SMALL_BODY_LIMIT)
    get_settings.cache_clear()

    try:
        settings = _body_limit_settings()
        app = create_app()
        app.dependency_overrides[get_settings] = lambda: settings
        app.dependency_overrides[get_redis] = lambda: AsyncMock()
        app.dependency_overrides[get_supabase] = lambda: AsyncMock()

        mock_journal = AsyncMock(spec=CachedJournalService)
        mock_journal.list_entries.return_value = ([], False)
        mock_journal.get_by_id.return_value = make_entry_row(entry_id=ENTRY_ID)

        mock_media = AsyncMock(spec=MediaService)
        mock_media.get_previews_for_entries.return_value = {}
        mock_media.upload.return_value = make_media_row(entry_id=ENTRY_ID)
        mock_media.create_signed_url.return_value = "https://example.com/signed"

        mock_blacklist = AsyncMock(spec=TokenBlacklistService)
        mock_blacklist.is_revoked.return_value = False

        app.dependency_overrides[get_journal_service] = lambda: mock_journal
        app.dependency_overrides[get_media_service] = lambda: mock_media
        app.dependency_overrides[get_token_blacklist] = lambda: mock_blacklist

        with TestClient(app) as c:
            yield c

        app.dependency_overrides.clear()
    finally:
        if original_env is None:
            os.environ.pop("MAX_REQUEST_BODY_BYTES", None)
        else:
            os.environ["MAX_REQUEST_BODY_BYTES"] = original_env
        get_settings.cache_clear()


class TestRequestBodyLimitMiddleware:
    def test_post_under_limit_succeeds(
        self,
        body_limit_client: TestClient,
    ) -> None:
        small_file = io.BytesIO(b"\xff\xd8\xff" + b"\x00" * 100)
        response = body_limit_client.post(
            MEDIA_URL,
            files={"file": ("small.jpg", small_file, "image/jpeg")},
            headers=_auth_headers(),
        )
        assert response.status_code == 201

    def test_post_over_limit_returns_413(
        self,
        body_limit_client: TestClient,
    ) -> None:
        oversized = io.BytesIO(b"\x00" * (_SMALL_BODY_LIMIT * 2))
        response = body_limit_client.post(
            MEDIA_URL,
            files={"file": ("big.jpg", oversized, "image/jpeg")},
            headers=_auth_headers(),
        )
        assert response.status_code == 413
        assert response.json()["detail"] == "Request body too large"

    def test_get_request_bypasses_limit(
        self,
        body_limit_client: TestClient,
    ) -> None:
        response = body_limit_client.get("/api/v1/health")
        assert response.status_code == 200

    def test_delete_request_bypasses_limit(
        self,
        body_limit_client: TestClient,
    ) -> None:
        media_id = uuid.uuid4()
        response = body_limit_client.delete(
            f"{MEDIA_URL}/{media_id}",
            headers=_auth_headers(),
        )
        assert response.status_code in (204, 404)

    def test_json_post_under_limit_succeeds(
        self,
        body_limit_client: TestClient,
    ) -> None:
        response = body_limit_client.post(
            "/api/v1/auth/sign-out",
            headers=_auth_headers(),
        )
        assert response.status_code in (204, 401, 403)

    def test_413_includes_connection_close(
        self,
        body_limit_client: TestClient,
    ) -> None:
        oversized = io.BytesIO(b"\x00" * (_SMALL_BODY_LIMIT * 2))
        response = body_limit_client.post(
            MEDIA_URL,
            files={"file": ("big.jpg", oversized, "image/jpeg")},
            headers=_auth_headers(),
        )
        assert response.status_code == 413
        assert response.headers.get("connection") == "close"


class TestBodyLimitWithDefaultSettings:
    def test_large_upload_allowed_with_default_limit(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
        mock_media_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row
        mock_media_service.upload.return_value = make_media_row(entry_id=ENTRY_ID)
        mock_media_service.create_signed_url.return_value = "https://example.com/signed"

        file_5mb = io.BytesIO(b"\xff\xd8\xff" + b"\x00" * (5 * 1024 * 1024))
        response = client.post(
            MEDIA_URL,
            files={"file": ("photo.jpg", file_5mb, "image/jpeg")},
            headers=_auth_headers(),
        )
        assert response.status_code == 201
