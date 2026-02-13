from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from nstil.api.deps import get_redis, get_settings
from nstil.config import Settings
from nstil.main import create_app


@pytest.fixture
def mock_redis() -> AsyncMock:
    mock = AsyncMock()
    mock.ping.return_value = True
    return mock


@pytest.fixture
def client(settings: Settings, mock_redis: AsyncMock) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_redis] = lambda: mock_redis
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
