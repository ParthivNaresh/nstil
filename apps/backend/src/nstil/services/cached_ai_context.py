from uuid import UUID

from nstil.models.ai_context import AIContextResponse
from nstil.services.ai.context import AIContextService
from nstil.services.cache.ai_cache import AICacheService


class CachedAIContextService:
    def __init__(self, db: AIContextService, cache: AICacheService) -> None:
        self._db = db
        self._cache = cache

    async def get_context(
        self,
        user_id: UUID,
        entry_limit: int = 10,
        days_back: int = 14,
    ) -> AIContextResponse:
        cached = await self._cache.get_context(user_id, entry_limit, days_back)
        if cached is not None:
            return cached

        context = await self._db.get_context(user_id, entry_limit, days_back)
        await self._cache.set_context(user_id, entry_limit, days_back, context)
        return context

    async def invalidate(self, user_id: UUID) -> None:
        await self._cache.invalidate_context(user_id)
