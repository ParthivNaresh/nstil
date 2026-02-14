import uuid
from unittest.mock import AsyncMock

import pytest

from nstil.services.cache.entry_cache import EntryCacheService
from nstil.services.cache.keys import entry_key, entry_list_key, entry_list_pattern
from tests.factories import make_entry_row

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
ENTRY_ID = uuid.UUID("00000000-0000-0000-0000-000000000099")


@pytest.fixture
def mock_redis() -> AsyncMock:
    mock = AsyncMock()
    mock.get.return_value = None
    mock.setex.return_value = True
    mock.delete.return_value = 1
    mock.scan.return_value = (0, [])
    return mock


@pytest.fixture
def cache(mock_redis: AsyncMock) -> EntryCacheService:
    return EntryCacheService(mock_redis)


class TestKeyGeneration:
    def test_entry_key_format(self) -> None:
        key = entry_key(USER_ID, ENTRY_ID)
        assert str(USER_ID) in key
        assert str(ENTRY_ID) in key
        assert key.startswith("nstil:")

    def test_entry_list_key_deterministic(self) -> None:
        key1 = entry_list_key(USER_ID, None, 20)
        key2 = entry_list_key(USER_ID, None, 20)
        assert key1 == key2

    def test_entry_list_key_varies_with_cursor(self) -> None:
        key1 = entry_list_key(USER_ID, None, 20)
        key2 = entry_list_key(USER_ID, "2026-01-01T00:00:00", 20)
        assert key1 != key2

    def test_entry_list_key_varies_with_limit(self) -> None:
        key1 = entry_list_key(USER_ID, None, 20)
        key2 = entry_list_key(USER_ID, None, 50)
        assert key1 != key2

    def test_entry_list_pattern(self) -> None:
        pattern = entry_list_pattern(USER_ID)
        assert pattern.endswith("*")
        assert str(USER_ID) in pattern


class TestEntryCacheGetSet:
    @pytest.mark.asyncio
    async def test_get_entry_miss(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.get.return_value = None
        result = await cache.get_entry(USER_ID, ENTRY_ID)
        assert result is None

    @pytest.mark.asyncio
    async def test_set_and_get_entry(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        row = make_entry_row(
            user_id=str(USER_ID),
            entry_id=str(ENTRY_ID),
        )
        await cache.set_entry(USER_ID, ENTRY_ID, row)
        mock_redis.setex.assert_called_once()

        stored_value = mock_redis.setex.call_args[0][2]
        mock_redis.get.return_value = stored_value

        result = await cache.get_entry(USER_ID, ENTRY_ID)
        assert result is not None
        assert result.id == ENTRY_ID
        assert result.user_id == USER_ID
        assert result.body == row.body

    @pytest.mark.asyncio
    async def test_set_entry_uses_correct_ttl(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        row = make_entry_row(user_id=str(USER_ID), entry_id=str(ENTRY_ID))
        await cache.set_entry(USER_ID, ENTRY_ID, row)
        ttl = mock_redis.setex.call_args[0][1]
        assert ttl == 300


class TestEntryCacheList:
    @pytest.mark.asyncio
    async def test_get_list_miss(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.get.return_value = None
        result = await cache.get_list(USER_ID, None, 20)
        assert result is None

    @pytest.mark.asyncio
    async def test_set_and_get_list(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        rows = [make_entry_row(user_id=str(USER_ID)) for _ in range(3)]
        await cache.set_list(USER_ID, None, 20, rows, True)
        mock_redis.setex.assert_called_once()

        stored_value = mock_redis.setex.call_args[0][2]
        mock_redis.get.return_value = stored_value

        result = await cache.get_list(USER_ID, None, 20)
        assert result is not None
        items, has_more = result
        assert len(items) == 3
        assert has_more is True

    @pytest.mark.asyncio
    async def test_set_list_uses_correct_ttl(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        await cache.set_list(USER_ID, None, 20, [], False)
        ttl = mock_redis.setex.call_args[0][1]
        assert ttl == 120

    @pytest.mark.asyncio
    async def test_get_list_corrupted_data(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.get.return_value = "not valid json {"
        result = await cache.get_list(USER_ID, None, 20)
        assert result is None


class TestEntryCacheInvalidation:
    @pytest.mark.asyncio
    async def test_invalidate_entry(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        await cache.invalidate_entry(USER_ID, ENTRY_ID)
        mock_redis.delete.assert_called_once_with(entry_key(USER_ID, ENTRY_ID))

    @pytest.mark.asyncio
    async def test_invalidate_user_lists(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.scan.return_value = (0, [b"key1", b"key2"])
        await cache.invalidate_user_lists(USER_ID)
        mock_redis.scan.assert_called_once()
        mock_redis.delete.assert_called_once_with(b"key1", b"key2")

    @pytest.mark.asyncio
    async def test_invalidate_user_lists_no_keys(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.scan.return_value = (0, [])
        await cache.invalidate_user_lists(USER_ID)
        mock_redis.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalidate_all(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.scan.return_value = (0, [])
        await cache.invalidate_all(USER_ID, ENTRY_ID)
        mock_redis.delete.assert_called_once_with(entry_key(USER_ID, ENTRY_ID))


class TestCacheResilience:
    @pytest.mark.asyncio
    async def test_get_survives_redis_error(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.get.side_effect = ConnectionError("Redis down")
        result = await cache.get_entry(USER_ID, ENTRY_ID)
        assert result is None

    @pytest.mark.asyncio
    async def test_set_survives_redis_error(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.setex.side_effect = ConnectionError("Redis down")
        row = make_entry_row(user_id=str(USER_ID), entry_id=str(ENTRY_ID))
        await cache.set_entry(USER_ID, ENTRY_ID, row)

    @pytest.mark.asyncio
    async def test_delete_survives_redis_error(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.delete.side_effect = ConnectionError("Redis down")
        await cache.invalidate_entry(USER_ID, ENTRY_ID)

    @pytest.mark.asyncio
    async def test_scan_survives_redis_error(
        self, cache: EntryCacheService, mock_redis: AsyncMock
    ) -> None:
        mock_redis.scan.side_effect = ConnectionError("Redis down")
        await cache.invalidate_user_lists(USER_ID)
