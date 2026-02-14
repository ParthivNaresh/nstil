import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.space import JournalSpaceCreate, JournalSpaceUpdate
from nstil.services.cache.entry_cache import EntryCacheService
from nstil.services.cache.space_cache import SpaceCacheService
from nstil.services.cached_space import CachedSpaceService
from nstil.services.space import JournalSpaceService
from tests.factories import make_space_row

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
SPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=JournalSpaceService)


@pytest.fixture
def mock_cache() -> AsyncMock:
    return AsyncMock(spec=SpaceCacheService)


@pytest.fixture
def mock_entry_cache() -> AsyncMock:
    return AsyncMock(spec=EntryCacheService)


@pytest.fixture
def service(
    mock_db: AsyncMock, mock_cache: AsyncMock, mock_entry_cache: AsyncMock
) -> CachedSpaceService:
    return CachedSpaceService(mock_db, mock_cache, mock_entry_cache)


class TestCachedCreate:
    @pytest.mark.asyncio
    async def test_create_delegates_to_db(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_space_row(user_id=str(USER_ID), name="Work")
        mock_db.create.return_value = row
        data = JournalSpaceCreate(name="Work")

        result = await service.create(USER_ID, data)

        assert result == row
        mock_db.create.assert_called_once_with(USER_ID, data)

    @pytest.mark.asyncio
    async def test_create_populates_cache(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_space_row(user_id=str(USER_ID), name="Work")
        mock_db.create.return_value = row
        data = JournalSpaceCreate(name="Work")

        await service.create(USER_ID, data)

        mock_cache.set_space.assert_called_once_with(USER_ID, row.id, row)
        mock_cache.invalidate_space_list.assert_called_once_with(USER_ID)


class TestCachedGetById:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_space_row(user_id=str(USER_ID), space_id=str(SPACE_ID))
        mock_cache.get_space.return_value = row

        result = await service.get_by_id(USER_ID, SPACE_ID)

        assert result == row
        mock_db.get_by_id.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_space_row(user_id=str(USER_ID), space_id=str(SPACE_ID))
        mock_cache.get_space.return_value = None
        mock_db.get_by_id.return_value = row

        result = await service.get_by_id(USER_ID, SPACE_ID)

        assert result == row
        mock_db.get_by_id.assert_called_once_with(USER_ID, SPACE_ID)
        mock_cache.set_space.assert_called_once_with(USER_ID, SPACE_ID, row)

    @pytest.mark.asyncio
    async def test_cache_miss_db_miss(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_cache.get_space.return_value = None
        mock_db.get_by_id.return_value = None

        result = await service.get_by_id(USER_ID, SPACE_ID)

        assert result is None
        mock_cache.set_space.assert_not_called()


class TestCachedList:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        rows = [make_space_row(user_id=str(USER_ID))]
        mock_cache.get_space_list.return_value = rows

        result = await service.list_spaces(USER_ID)

        assert result == rows
        mock_db.list_spaces.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        rows = [make_space_row(user_id=str(USER_ID))]
        mock_cache.get_space_list.return_value = None
        mock_db.list_spaces.return_value = rows

        result = await service.list_spaces(USER_ID)

        assert result == rows
        mock_cache.set_space_list.assert_called_once_with(USER_ID, rows)


class TestCachedUpdate:
    @pytest.mark.asyncio
    async def test_update_invalidates_cache(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_space_row(user_id=str(USER_ID), space_id=str(SPACE_ID))
        mock_db.update.return_value = row
        data = JournalSpaceUpdate(name="Updated")

        result = await service.update(USER_ID, SPACE_ID, data)

        assert result == row
        mock_cache.invalidate_all.assert_called_once_with(USER_ID, SPACE_ID)

    @pytest.mark.asyncio
    async def test_update_not_found_no_invalidation(
        self, service: CachedSpaceService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.update.return_value = None
        data = JournalSpaceUpdate(name="Updated")

        result = await service.update(USER_ID, SPACE_ID, data)

        assert result is None
        mock_cache.invalidate_all.assert_not_called()


class TestCachedDelete:
    @pytest.mark.asyncio
    async def test_delete_invalidates_all_caches(
        self,
        service: CachedSpaceService,
        mock_db: AsyncMock,
        mock_cache: AsyncMock,
        mock_entry_cache: AsyncMock,
    ) -> None:
        mock_db.soft_delete.return_value = True

        result = await service.soft_delete(USER_ID, SPACE_ID)

        assert result is True
        mock_cache.invalidate_all.assert_called_once_with(USER_ID, SPACE_ID)
        mock_entry_cache.invalidate_user_lists.assert_called_once_with(USER_ID)
        mock_entry_cache.invalidate_user_searches.assert_called_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_delete_not_found_no_invalidation(
        self,
        service: CachedSpaceService,
        mock_db: AsyncMock,
        mock_cache: AsyncMock,
        mock_entry_cache: AsyncMock,
    ) -> None:
        mock_db.soft_delete.return_value = False

        result = await service.soft_delete(USER_ID, SPACE_ID)

        assert result is False
        mock_cache.invalidate_all.assert_not_called()
        mock_entry_cache.invalidate_user_lists.assert_not_called()
        mock_entry_cache.invalidate_user_searches.assert_not_called()
