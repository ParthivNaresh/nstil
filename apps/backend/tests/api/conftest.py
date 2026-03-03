import os
from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from nstil.api.deps import (
    get_ai_context_service,
    get_ai_insight_service,
    get_ai_profile_service,
    get_ai_prompt_service,
    get_breathing_service,
    get_check_in_orchestrator,
    get_insight_engine,
    get_journal_service,
    get_media_service,
    get_notification_service,
    get_profile_service,
    get_prompt_engine,
    get_redis,
    get_settings,
    get_space_service,
    get_supabase,
    get_token_blacklist,
)
from nstil.config import Settings
from nstil.services.ai.check_in import CheckInOrchestrator
from nstil.services.ai.insight import AIInsightService
from nstil.services.ai.insight_engine import InsightEngine
from nstil.services.ai.prompt import AIPromptService
from nstil.services.ai.prompt_engine import PromptEngine
from nstil.services.breathing import BreathingService
from nstil.services.cached_ai_context import CachedAIContextService
from nstil.services.cached_ai_profile import CachedAIProfileService
from nstil.services.cached_journal import CachedJournalService
from nstil.services.cached_notification import CachedNotificationService
from nstil.services.cached_profile import CachedProfileService
from nstil.services.cached_space import CachedSpaceService
from nstil.services.media import MediaService
from nstil.services.token_blacklist import TokenBlacklistService

os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")


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
def mock_media_service() -> AsyncMock:
    mock = AsyncMock(spec=MediaService)
    mock.get_previews_for_entries.return_value = {}
    return mock


@pytest.fixture
def mock_check_in_orchestrator() -> AsyncMock:
    return AsyncMock(spec=CheckInOrchestrator)


@pytest.fixture
def mock_insight_engine() -> AsyncMock:
    return AsyncMock(spec=InsightEngine)


@pytest.fixture
def mock_ai_insight_service() -> AsyncMock:
    return AsyncMock(spec=AIInsightService)


@pytest.fixture
def mock_ai_profile_service() -> AsyncMock:
    return AsyncMock(spec=CachedAIProfileService)


@pytest.fixture
def mock_notification_service() -> AsyncMock:
    return AsyncMock(spec=CachedNotificationService)


@pytest.fixture
def mock_ai_context_service() -> AsyncMock:
    return AsyncMock(spec=CachedAIContextService)


@pytest.fixture
def mock_ai_prompt_service() -> AsyncMock:
    return AsyncMock(spec=AIPromptService)


@pytest.fixture
def mock_prompt_engine() -> AsyncMock:
    return AsyncMock(spec=PromptEngine)


@pytest.fixture
def mock_profile_service() -> AsyncMock:
    return AsyncMock(spec=CachedProfileService)


@pytest.fixture
def mock_breathing_service() -> AsyncMock:
    return AsyncMock(spec=BreathingService)


@pytest.fixture
def mock_token_blacklist() -> AsyncMock:
    mock = AsyncMock(spec=TokenBlacklistService)
    mock.is_revoked.return_value = False
    return mock


@pytest.fixture
def client(
    settings: Settings,
    mock_redis: AsyncMock,
    mock_supabase: AsyncMock,
    mock_journal_service: AsyncMock,
    mock_space_service: AsyncMock,
    mock_media_service: AsyncMock,
    mock_breathing_service: AsyncMock,
    mock_check_in_orchestrator: AsyncMock,
    mock_insight_engine: AsyncMock,
    mock_ai_insight_service: AsyncMock,
    mock_ai_profile_service: AsyncMock,
    mock_notification_service: AsyncMock,
    mock_ai_context_service: AsyncMock,
    mock_ai_prompt_service: AsyncMock,
    mock_prompt_engine: AsyncMock,
    mock_profile_service: AsyncMock,
    mock_token_blacklist: AsyncMock,
) -> Iterator[TestClient]:
    from nstil.main import create_app

    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_journal_service] = lambda: mock_journal_service
    app.dependency_overrides[get_space_service] = lambda: mock_space_service
    app.dependency_overrides[get_media_service] = lambda: mock_media_service
    app.dependency_overrides[get_breathing_service] = lambda: mock_breathing_service
    app.dependency_overrides[get_check_in_orchestrator] = lambda: mock_check_in_orchestrator
    app.dependency_overrides[get_insight_engine] = lambda: mock_insight_engine
    app.dependency_overrides[get_ai_insight_service] = lambda: mock_ai_insight_service
    app.dependency_overrides[get_ai_profile_service] = lambda: mock_ai_profile_service
    app.dependency_overrides[get_notification_service] = lambda: mock_notification_service
    app.dependency_overrides[get_ai_context_service] = lambda: mock_ai_context_service
    app.dependency_overrides[get_ai_prompt_service] = lambda: mock_ai_prompt_service
    app.dependency_overrides[get_prompt_engine] = lambda: mock_prompt_engine
    app.dependency_overrides[get_profile_service] = lambda: mock_profile_service
    app.dependency_overrides[get_token_blacklist] = lambda: mock_token_blacklist
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    get_settings.cache_clear()
