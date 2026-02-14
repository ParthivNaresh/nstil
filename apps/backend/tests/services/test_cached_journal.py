import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.models.journal import JournalEntryCreate, JournalEntryUpdate
from nstil.models.pagination import CursorParams
from nstil.services.cache.entry_cache import EntryCacheService
from nstil.services.cached_journal import CachedJournalService
from nstil.services.journal import JournalService
from tests.factories import DEFAULT_JOURNAL_ID, make_entry_row

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
ENTRY_ID = uuid.UUID("00000000-0000-0000-0000-000000000099")


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=JournalService)


@pytest.fixture
def mock_cache() -> AsyncMock:
    return AsyncMock(spec=EntryCacheService)


@pytest.fixture
def service(mock_db: AsyncMock, mock_cache: AsyncMock) -> CachedJournalService:
    return CachedJournalService(mock_db, mock_cache)


class TestCachedCreate:
    @pytest.mark.asyncio
    async def test_create_delegates_to_db(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID))
        mock_db.create.return_value = row
        data = JournalEntryCreate(journal_id=DEFAULT_JOURNAL_ID, body="Hello")

        result = await service.create(USER_ID, data)

        assert result == row
        mock_db.create.assert_called_once_with(USER_ID, data)

    @pytest.mark.asyncio
    async def test_create_populates_cache(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID))
        mock_db.create.return_value = row
        data = JournalEntryCreate(journal_id=DEFAULT_JOURNAL_ID, body="Hello")

        await service.create(USER_ID, data)

        mock_cache.set_entry.assert_called_once_with(USER_ID, row.id, row)
        mock_cache.invalidate_user_lists.assert_called_once_with(USER_ID)


class TestCachedGetById:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID), entry_id=str(ENTRY_ID))
        mock_cache.get_entry.return_value = row

        result = await service.get_by_id(USER_ID, ENTRY_ID)

        assert result == row
        mock_db.get_by_id.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID), entry_id=str(ENTRY_ID))
        mock_cache.get_entry.return_value = None
        mock_db.get_by_id.return_value = row

        result = await service.get_by_id(USER_ID, ENTRY_ID)

        assert result == row
        mock_db.get_by_id.assert_called_once_with(USER_ID, ENTRY_ID)
        mock_cache.set_entry.assert_called_once_with(USER_ID, ENTRY_ID, row)

    @pytest.mark.asyncio
    async def test_cache_miss_db_miss(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_cache.get_entry.return_value = None
        mock_db.get_by_id.return_value = None

        result = await service.get_by_id(USER_ID, ENTRY_ID)

        assert result is None
        mock_cache.set_entry.assert_not_called()


class TestCachedList:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_db(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        rows = [make_entry_row(user_id=str(USER_ID))]
        mock_cache.get_list.return_value = (rows, False)
        params = CursorParams(cursor=None, limit=20)

        result_rows, has_more = await service.list_entries(USER_ID, params)

        assert result_rows == rows
        assert has_more is False
        mock_db.list_entries.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_queries_db(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        rows = [make_entry_row(user_id=str(USER_ID))]
        mock_cache.get_list.return_value = None
        mock_db.list_entries.return_value = (rows, True)
        params = CursorParams(cursor=None, limit=20)

        result_rows, has_more = await service.list_entries(USER_ID, params)

        assert result_rows == rows
        assert has_more is True
        mock_cache.set_list.assert_called_once_with(USER_ID, None, 20, rows, True, None)

    @pytest.mark.asyncio
    async def test_list_with_journal_filter(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        journal_uuid = uuid.UUID(DEFAULT_JOURNAL_ID)
        rows = [make_entry_row(user_id=str(USER_ID))]
        mock_cache.get_list.return_value = None
        mock_db.list_entries.return_value = (rows, False)
        params = CursorParams(cursor=None, limit=20)

        result_rows, has_more = await service.list_entries(
            USER_ID, params, journal_id=journal_uuid
        )

        assert result_rows == rows
        mock_db.list_entries.assert_called_once_with(USER_ID, params, journal_uuid)
        mock_cache.set_list.assert_called_once_with(
            USER_ID, None, 20, rows, False, DEFAULT_JOURNAL_ID
        )


class TestCachedUpdate:
    @pytest.mark.asyncio
    async def test_update_invalidates_cache(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID), entry_id=str(ENTRY_ID))
        mock_db.update.return_value = row
        data = JournalEntryUpdate(title="Updated")

        result = await service.update(USER_ID, ENTRY_ID, data)

        assert result == row
        mock_cache.invalidate_all.assert_called_once_with(USER_ID, ENTRY_ID)

    @pytest.mark.asyncio
    async def test_update_not_found_no_invalidation(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.update.return_value = None
        data = JournalEntryUpdate(title="Updated")

        result = await service.update(USER_ID, ENTRY_ID, data)

        assert result is None
        mock_cache.invalidate_all.assert_not_called()


class TestCachedDelete:
    @pytest.mark.asyncio
    async def test_delete_invalidates_cache(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.soft_delete.return_value = True

        result = await service.soft_delete(USER_ID, ENTRY_ID)

        assert result is True
        mock_cache.invalidate_all.assert_called_once_with(USER_ID, ENTRY_ID)

    @pytest.mark.asyncio
    async def test_delete_not_found_no_invalidation(
        self, service: CachedJournalService, mock_db: AsyncMock, mock_cache: AsyncMock
    ) -> None:
        mock_db.soft_delete.return_value = False

        result = await service.soft_delete(USER_ID, ENTRY_ID)

        assert result is False
        mock_cache.invalidate_all.assert_not_called()
