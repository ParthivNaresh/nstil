from uuid import UUID

from nstil.models.journal import JournalEntryCreate, JournalEntryRow, JournalEntryUpdate
from nstil.models.pagination import CursorParams, SearchParams
from nstil.services.cache.entry_cache import EntryCacheService
from nstil.services.journal import JournalService


class CachedJournalService:
    def __init__(
        self, db: JournalService, cache: EntryCacheService
    ) -> None:
        self._db = db
        self._cache = cache

    async def create(
        self, user_id: UUID, data: JournalEntryCreate
    ) -> JournalEntryRow:
        row = await self._db.create(user_id, data)
        await self._cache.set_entry(user_id, row.id, row)
        await self._cache.invalidate_user_lists(user_id)
        return row

    async def get_by_id(
        self, user_id: UUID, entry_id: UUID
    ) -> JournalEntryRow | None:
        cached = await self._cache.get_entry(user_id, entry_id)
        if cached is not None:
            return cached

        row = await self._db.get_by_id(user_id, entry_id)
        if row is not None:
            await self._cache.set_entry(user_id, entry_id, row)
        return row

    async def list_entries(
        self,
        user_id: UUID,
        params: CursorParams,
        journal_id: UUID | None = None,
    ) -> tuple[list[JournalEntryRow], bool]:
        journal_id_str = str(journal_id) if journal_id else None
        cached = await self._cache.get_list(
            user_id, params.cursor, params.limit, journal_id_str
        )
        if cached is not None:
            return cached

        rows, has_more = await self._db.list_entries(user_id, params, journal_id)
        await self._cache.set_list(
            user_id, params.cursor, params.limit, rows, has_more, journal_id_str
        )
        return rows, has_more

    async def update(
        self, user_id: UUID, entry_id: UUID, data: JournalEntryUpdate
    ) -> JournalEntryRow | None:
        row = await self._db.update(user_id, entry_id, data)
        if row is not None:
            await self._cache.invalidate_all(user_id, entry_id)
        return row

    async def search(
        self,
        user_id: UUID,
        params: SearchParams,
        journal_id: UUID | None = None,
    ) -> tuple[list[JournalEntryRow], bool]:
        journal_id_str = str(journal_id) if journal_id else None
        cached = await self._cache.get_search(
            user_id, params.query, params.cursor, params.limit, journal_id_str
        )
        if cached is not None:
            return cached

        rows, has_more = await self._db.search(user_id, params, journal_id)
        await self._cache.set_search(
            user_id, params.query, params.cursor, params.limit, rows, has_more,
            journal_id_str,
        )
        return rows, has_more

    async def soft_delete(self, user_id: UUID, entry_id: UUID) -> bool:
        deleted = await self._db.soft_delete(user_id, entry_id)
        if deleted:
            await self._cache.invalidate_all(user_id, entry_id)
        return deleted
