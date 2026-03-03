import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.profile import ProfileUpdate
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.cached_profile import CachedProfileService
from nstil.services.profile import ProfileService
from tests.factories import make_profile_row

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=ProfileService)


@pytest.fixture
def mock_cache() -> AsyncMock:
    return AsyncMock(spec=AICacheService)


@pytest.fixture
def service(mock_db: AsyncMock, mock_cache: AsyncMock) -> CachedProfileService:
    return CachedProfileService(mock_db, mock_cache)


class TestCachedGet:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_profile_row(display_name="Parthiv")
        mock_cache.get_user_profile.return_value = row

        result = await service.get(USER_ID)

        assert result == row
        mock_db.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db_and_populates(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_profile_row(display_name="Parthiv")
        mock_cache.get_user_profile.return_value = None
        mock_db.get.return_value = row

        result = await service.get(USER_ID)

        assert result == row
        mock_db.get.assert_called_once_with(USER_ID)
        mock_cache.set_user_profile.assert_called_once_with(USER_ID, row)

    @pytest.mark.asyncio
    async def test_cache_miss_db_miss(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_cache.get_user_profile.return_value = None
        mock_db.get.return_value = None

        result = await service.get(USER_ID)

        assert result is None
        mock_cache.set_user_profile.assert_not_called()


class TestCachedUpdate:
    @pytest.mark.asyncio
    async def test_update_invalidates_cache(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_profile_row(display_name="Updated")
        mock_db.update.return_value = row
        data = ProfileUpdate(display_name="Updated")

        result = await service.update(USER_ID, data)

        assert result == row
        mock_db.update.assert_called_once_with(USER_ID, data)
        mock_cache.invalidate_user_profile.assert_called_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_update_not_found_no_invalidation(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.update.return_value = None
        data = ProfileUpdate(display_name="Updated")

        result = await service.update(USER_ID, data)

        assert result is None
        mock_cache.invalidate_user_profile.assert_not_called()


class TestCachedCompleteOnboarding:
    @pytest.mark.asyncio
    async def test_complete_onboarding_invalidates_cache(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        from datetime import UTC, datetime

        row = make_profile_row(onboarding_completed_at=datetime.now(UTC))
        mock_db.complete_onboarding.return_value = row

        result = await service.complete_onboarding(USER_ID)

        assert result == row
        assert result.onboarding_completed_at is not None
        mock_db.complete_onboarding.assert_called_once_with(USER_ID)
        mock_cache.invalidate_user_profile.assert_called_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_complete_onboarding_not_found_no_invalidation(
        self, service: CachedProfileService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.complete_onboarding.return_value = None

        result = await service.complete_onboarding(USER_ID)

        assert result is None
        mock_cache.invalidate_user_profile.assert_not_called()
