from uuid import UUID

from nstil.models.ai_profile import UserAIProfileRow, UserAIProfileUpdate
from nstil.services.ai.profile import AIProfileService
from nstil.services.cache.ai_cache import AICacheService


class CachedAIProfileService:
    def __init__(self, db: AIProfileService, cache: AICacheService) -> None:
        self._db = db
        self._cache = cache

    async def get(self, user_id: UUID) -> UserAIProfileRow | None:
        cached = await self._cache.get_profile(user_id)
        if cached is not None:
            return cached

        row = await self._db.get(user_id)
        if row is not None:
            await self._cache.set_profile(user_id, row)
        return row

    async def update(
        self, user_id: UUID, data: UserAIProfileUpdate
    ) -> UserAIProfileRow | None:
        row = await self._db.update(user_id, data)
        if row is not None:
            await self._cache.invalidate_profile(user_id)
            await self._cache.invalidate_context(user_id)
        return row

    async def update_last_check_in(self, user_id: UUID, timestamp: str) -> None:
        await self._db.update_last_check_in(user_id, timestamp)
        await self._cache.invalidate_profile(user_id)
