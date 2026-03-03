from uuid import UUID

from nstil.models.notification import NotificationPreferencesRow, NotificationPreferencesUpdate
from nstil.services.cache.ai_cache import AICacheService
from nstil.services.notification import NotificationService


class CachedNotificationService:
    def __init__(self, db: NotificationService, cache: AICacheService) -> None:
        self._db = db
        self._cache = cache

    async def get(self, user_id: UUID) -> NotificationPreferencesRow | None:
        cached = await self._cache.get_notification_prefs(user_id)
        if cached is not None:
            return cached

        row = await self._db.get(user_id)
        if row is not None:
            await self._cache.set_notification_prefs(user_id, row)
        return row

    async def get_or_create(self, user_id: UUID) -> NotificationPreferencesRow | None:
        cached = await self._cache.get_notification_prefs(user_id)
        if cached is not None:
            return cached

        row = await self._db.get_or_create(user_id)
        if row is not None:
            await self._cache.set_notification_prefs(user_id, row)
        return row

    async def update(
        self, user_id: UUID, data: NotificationPreferencesUpdate
    ) -> NotificationPreferencesRow | None:
        row = await self._db.update(user_id, data)
        if row is not None:
            await self._cache.invalidate_notification_prefs(user_id)
        return row

    async def update_last_notified(self, user_id: UUID, timestamp: str) -> None:
        await self._db.update_last_notified(user_id, timestamp)
        await self._cache.invalidate_notification_prefs(user_id)
