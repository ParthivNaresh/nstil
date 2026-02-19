import json
from uuid import UUID

from nstil.models.space import JournalSpaceRow
from nstil.observability import get_logger
from nstil.services.cache.base import BaseCacheService
from nstil.services.cache.constants import ENTRY_LIST_TTL_SECONDS, ENTRY_TTL_SECONDS
from nstil.services.cache.space_keys import space_key, space_list_key

logger = get_logger("nstil.cache.space")


class SpaceCacheService(BaseCacheService):
    async def get_space(
        self, user_id: UUID, space_id: UUID
    ) -> JournalSpaceRow | None:
        data = await self._get(space_key(user_id, space_id))
        if data is None:
            return None
        return self._deserialize(JournalSpaceRow, data)

    async def set_space(
        self, user_id: UUID, space_id: UUID, row: JournalSpaceRow
    ) -> None:
        await self._set(
            space_key(user_id, space_id),
            self._serialize(row),
            ENTRY_TTL_SECONDS,
        )

    async def invalidate_space(self, user_id: UUID, space_id: UUID) -> None:
        await self._delete(space_key(user_id, space_id))

    async def get_space_list(
        self, user_id: UUID
    ) -> list[JournalSpaceRow] | None:
        data = await self._get(space_list_key(user_id))
        if data is None:
            return None
        try:
            parsed: list[object] = json.loads(data)
            if not isinstance(parsed, list):
                return None
            return [JournalSpaceRow.model_validate(item) for item in parsed]
        except (json.JSONDecodeError, TypeError, ValueError):
            logger.warning("cache.space_list.deserialize_failed", user_id=str(user_id))
            return None

    async def set_space_list(
        self, user_id: UUID, rows: list[JournalSpaceRow]
    ) -> None:
        payload = json.dumps([row.model_dump(mode="json") for row in rows])
        await self._set(
            space_list_key(user_id),
            payload,
            ENTRY_LIST_TTL_SECONDS,
        )

    async def invalidate_space_list(self, user_id: UUID) -> None:
        await self._delete(space_list_key(user_id))

    async def invalidate_all(self, user_id: UUID, space_id: UUID) -> None:
        await self.invalidate_space(user_id, space_id)
        await self.invalidate_space_list(user_id)
