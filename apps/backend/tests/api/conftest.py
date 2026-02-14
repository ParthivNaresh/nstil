from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from nstil.api.deps import (
    get_journal_service,
    get_redis,
    get_settings,
    get_space_service,
    get_supabase,
)
from nstil.config import Settings
from nstil.main import create_app
from nstil.services.cached_journal import CachedJournalService
from nstil.services.cached_space import CachedSpaceService


@pytest.fixture
def mock_redis() -> AsyncMock:
    mock = AsyncMock()
    mock.ping.return_value = True
    return mock


@pytest.fixture
def mock_supabase() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_journal_service() -> AsyncMock:
    return AsyncMock(spec=CachedJournalService)


@pytest.fixture
def mock_space_service() -> AsyncMock:
    return AsyncMock(spec=CachedSpaceService)


@pytest.fixture
def client(
    settings: Settings,
    mock_redis: AsyncMock,
    mock_supabase: AsyncMock,
    mock_journal_service: AsyncMock,
    mock_space_service: AsyncMock,
) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_journal_service] = lambda: mock_journal_service
    app.dependency_overrides[get_space_service] = lambda: mock_space_service
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
