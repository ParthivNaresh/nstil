import json
from uuid import UUID

from nstil.models.journal import JournalEntryRow
from nstil.observability import get_logger
from nstil.services.cache.base import BaseCacheService
from nstil.services.cache.constants import (
    ENTRY_LIST_TTL_SECONDS,
    ENTRY_TTL_SECONDS,
    SEARCH_TTL_SECONDS,
)
from nstil.services.cache.keys import (
    entry_key,
    entry_list_key,
    entry_list_pattern,
    search_key,
    search_pattern,
)

logger = get_logger("nstil.cache.entry")


class EntryCacheService(BaseCacheService):
    async def get_entry(
        self, user_id: UUID, entry_id: UUID
    ) -> JournalEntryRow | None:
        data = await self._get(entry_key(user_id, entry_id))
        if data is None:
            return None
        return self._deserialize(JournalEntryRow, data)

    async def set_entry(
        self, user_id: UUID, entry_id: UUID, row: JournalEntryRow
    ) -> None:
        await self._set(
            entry_key(user_id, entry_id),
            self._serialize(row),
            ENTRY_TTL_SECONDS,
        )

    async def invalidate_entry(self, user_id: UUID, entry_id: UUID) -> None:
        await self._delete(entry_key(user_id, entry_id))

    async def get_list(
        self, user_id: UUID, cursor: str | None, limit: int
    ) -> tuple[list[JournalEntryRow], bool] | None:
        data = await self._get(entry_list_key(user_id, cursor, limit))
        if data is None:
            return None
        try:
            parsed: dict[str, object] = json.loads(data)
            items_raw = parsed["items"]
            has_more = parsed["has_more"]
            if not isinstance(items_raw, list) or not isinstance(has_more, bool):
                return None
            rows = [JournalEntryRow.model_validate(item) for item in items_raw]
            return rows, has_more
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            logger.warning("cache.list.deserialize_failed", user_id=str(user_id))
            return None

    async def set_list(
        self,
        user_id: UUID,
        cursor: str | None,
        limit: int,
        rows: list[JournalEntryRow],
        has_more: bool,
    ) -> None:
        payload = json.dumps({
            "items": [row.model_dump(mode="json") for row in rows],
            "has_more": has_more,
        })
        await self._set(
            entry_list_key(user_id, cursor, limit),
            payload,
            ENTRY_LIST_TTL_SECONDS,
        )

    async def get_search(
        self, user_id: UUID, query: str, cursor: str | None, limit: int
    ) -> tuple[list[JournalEntryRow], bool] | None:
        data = await self._get(search_key(user_id, query, cursor, limit))
        if data is None:
            return None
        try:
            parsed: dict[str, object] = json.loads(data)
            items_raw = parsed["items"]
            has_more = parsed["has_more"]
            if not isinstance(items_raw, list) or not isinstance(has_more, bool):
                return None
            rows = [JournalEntryRow.model_validate(item) for item in items_raw]
            return rows, has_more
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            logger.warning("cache.search.deserialize_failed", user_id=str(user_id))
            return None

    async def set_search(
        self,
        user_id: UUID,
        query: str,
        cursor: str | None,
        limit: int,
        rows: list[JournalEntryRow],
        has_more: bool,
    ) -> None:
        payload = json.dumps({
            "items": [row.model_dump(mode="json") for row in rows],
            "has_more": has_more,
        })
        await self._set(
            search_key(user_id, query, cursor, limit),
            payload,
            SEARCH_TTL_SECONDS,
        )

    async def invalidate_user_lists(self, user_id: UUID) -> None:
        pattern = entry_list_pattern(user_id)
        count = await self._delete_pattern(pattern)
        if count > 0:
            logger.debug(
                "cache.lists.invalidated",
                user_id=str(user_id),
                count=count,
            )

    async def invalidate_user_searches(self, user_id: UUID) -> None:
        pattern = search_pattern(user_id)
        count = await self._delete_pattern(pattern)
        if count > 0:
            logger.debug(
                "cache.searches.invalidated",
                user_id=str(user_id),
                count=count,
            )

    async def invalidate_all(self, user_id: UUID, entry_id: UUID) -> None:
        await self.invalidate_entry(user_id, entry_id)
        await self.invalidate_user_lists(user_id)
        await self.invalidate_user_searches(user_id)
