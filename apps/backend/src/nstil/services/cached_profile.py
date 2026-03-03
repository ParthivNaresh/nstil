from uuid import UUID

from nstil.models.profile import ProfileRow, ProfileUpdate
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.profile import ProfileService


class CachedProfileService:
    def __init__(self, db: ProfileService, cache: AICacheService) -> None:
        self._db = db
        self._cache = cache

    async def get(self, user_id: UUID) -> ProfileRow | None:
        cached = await self._cache.get_user_profile(user_id)
        if cached is not None:
            return cached

        row = await self._db.get(user_id)
        if row is not None:
            await self._cache.set_user_profile(user_id, row)
        return row

    async def update(self, user_id: UUID, data: ProfileUpdate) -> ProfileRow | None:
        row = await self._db.update(user_id, data)
        if row is not None:
            await self._cache.invalidate_user_profile(user_id)
        return row

    async def complete_onboarding(self, user_id: UUID) -> ProfileRow | None:
        row = await self._db.complete_onboarding(user_id)
        if row is not None:
            await self._cache.invalidate_user_profile(user_id)
        return row
