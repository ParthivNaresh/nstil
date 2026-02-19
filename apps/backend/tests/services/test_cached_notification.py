import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.notification import NotificationPreferencesUpdate
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.cached_notification import CachedNotificationService
from nstil.services.notification import NotificationService
from tests.factories import make_notification_prefs_row

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=NotificationService)


@pytest.fixture
def mock_cache() -> AsyncMock:
    return AsyncMock(spec=AICacheService)


@pytest.fixture
def service(mock_db: AsyncMock, mock_cache: AsyncMock) -> CachedNotificationService:
    return CachedNotificationService(mock_db, mock_cache)


class TestCachedGet:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_notification_prefs_row()
        mock_cache.get_notification_prefs.return_value = row

        result = await service.get(USER_ID)

        assert result == row
        mock_db.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db_and_populates(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_notification_prefs_row()
        mock_cache.get_notification_prefs.return_value = None
        mock_db.get.return_value = row

        result = await service.get(USER_ID)

        assert result == row
        mock_db.get.assert_called_once_with(USER_ID)
        mock_cache.set_notification_prefs.assert_called_once_with(USER_ID, row)

    @pytest.mark.asyncio
    async def test_cache_miss_db_miss(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_cache.get_notification_prefs.return_value = None
        mock_db.get.return_value = None

        result = await service.get(USER_ID)

        assert result is None
        mock_cache.set_notification_prefs.assert_not_called()


class TestCachedUpdate:
    @pytest.mark.asyncio
    async def test_update_invalidates_cache(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_notification_prefs_row(reminders_enabled=False)
        mock_db.update.return_value = row
        data = NotificationPreferencesUpdate(reminders_enabled=False)

        result = await service.update(USER_ID, data)

        assert result == row
        mock_db.update.assert_called_once_with(USER_ID, data)
        mock_cache.invalidate_notification_prefs.assert_called_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_update_not_found_no_invalidation(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.update.return_value = None
        data = NotificationPreferencesUpdate(reminders_enabled=False)

        result = await service.update(USER_ID, data)

        assert result is None
        mock_cache.invalidate_notification_prefs.assert_not_called()


class TestCachedUpdateLastNotified:
    @pytest.mark.asyncio
    async def test_delegates_and_invalidates(
        self, service: CachedNotificationService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        timestamp = "2025-01-15T10:00:00+00:00"

        await service.update_last_notified(USER_ID, timestamp)

        mock_db.update_last_notified.assert_called_once_with(USER_ID, timestamp)
        mock_cache.invalidate_notification_prefs.assert_called_once_with(USER_ID)
