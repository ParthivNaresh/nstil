import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.ai_context import (
    AIContextProfile,
    AIContextResponse,
    AIContextStats,
)
from nstil.services.ai.context import AIContextService
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.cached_ai_context import CachedAIContextService

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


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


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=AIContextService)


@pytest.fixture
def mock_cache() -> AsyncMock:
    return AsyncMock(spec=AICacheService)


@pytest.fixture
def service(mock_db: AsyncMock, mock_cache: AsyncMock) -> CachedAIContextService:
    return CachedAIContextService(mock_db, mock_cache)


class TestCachedGetContext:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedAIContextService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        ctx = _make_context()
        mock_cache.get_context.return_value = ctx

        result = await service.get_context(USER_ID, entry_limit=10, days_back=14)

        assert result == ctx
        mock_db.get_context.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db_and_populates(
        self, service: CachedAIContextService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        ctx = _make_context()
        mock_cache.get_context.return_value = None
        mock_db.get_context.return_value = ctx

        result = await service.get_context(USER_ID, entry_limit=20, days_back=7)

        assert result == ctx
        mock_db.get_context.assert_called_once_with(USER_ID, 20, 7)
        mock_cache.set_context.assert_called_once_with(USER_ID, 20, 7, ctx)

    @pytest.mark.asyncio
    async def test_default_params(
        self, service: CachedAIContextService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        ctx = _make_context()
        mock_cache.get_context.return_value = None
        mock_db.get_context.return_value = ctx

        await service.get_context(USER_ID)

        mock_cache.get_context.assert_called_once_with(USER_ID, 10, 14)
        mock_db.get_context.assert_called_once_with(USER_ID, 10, 14)


class TestCachedInvalidate:
    @pytest.mark.asyncio
    async def test_invalidate_clears_cache(
        self, service: CachedAIContextService, mock_cache: AsyncMock
    ) -> None:
        await service.invalidate(USER_ID)

        mock_cache.invalidate_context.assert_called_once_with(USER_ID)
