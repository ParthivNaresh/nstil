from uuid import UUID

from nstil.models.space import JournalSpaceCreate, JournalSpaceRow, JournalSpaceUpdate
from nstil.services.cache.entry_cache import EntryCacheService
from nstil.services.cache.space_cache import SpaceCacheService
from nstil.services.space import JournalSpaceService


class CachedSpaceService:
    def __init__(
        self,
        db: JournalSpaceService,
        cache: SpaceCacheService,
        entry_cache: EntryCacheService,
    ) -> None:
        self._db = db
        self._cache = cache
        self._entry_cache = entry_cache

    async def create(
        self, user_id: UUID, data: JournalSpaceCreate
    ) -> JournalSpaceRow:
        row = await self._db.create(user_id, data)
        await self._cache.set_space(user_id, row.id, row)
        await self._cache.invalidate_space_list(user_id)
        return row

    async def get_by_id(
        self, user_id: UUID, space_id: UUID
    ) -> JournalSpaceRow | None:
        cached = await self._cache.get_space(user_id, space_id)
        if cached is not None:
            return cached

        row = await self._db.get_by_id(user_id, space_id)
        if row is not None:
            await self._cache.set_space(user_id, space_id, row)
        return row

    async def list_spaces(self, user_id: UUID) -> list[JournalSpaceRow]:
        cached = await self._cache.get_space_list(user_id)
        if cached is not None:
            return cached

        rows = await self._db.list_spaces(user_id)
        await self._cache.set_space_list(user_id, rows)
        return rows

    async def update(
        self, user_id: UUID, space_id: UUID, data: JournalSpaceUpdate
    ) -> JournalSpaceRow | None:
        row = await self._db.update(user_id, space_id, data)
        if row is not None:
            await self._cache.invalidate_all(user_id, space_id)
        return row

    async def soft_delete(self, user_id: UUID, space_id: UUID) -> bool:
        deleted = await self._db.soft_delete(user_id, space_id)
        if deleted:
            await self._cache.invalidate_all(user_id, space_id)
            await self._entry_cache.invalidate_user_lists(user_id)
            await self._entry_cache.invalidate_user_searches(user_id)
        return deleted

    async def get_default(self, user_id: UUID) -> JournalSpaceRow | None:
        return await self._db.get_default(user_id)
