from uuid import UUID

from nstil.models.ai_context import AIContextResponse
from nstil.models.ai_profile import UserAIProfileRow
from nstil.models.notification import NotificationPreferencesRow
from nstil.observability import get_logger
from nstil.services.cache.ai_keys import (
    ai_context_key,
    ai_context_pattern,
    ai_profile_key,
    notification_prefs_key,
)
from nstil.services.cache.base import BaseCacheService
from nstil.services.cache.constants import (
    AI_CONTEXT_TTL_SECONDS,
    AI_PROFILE_TTL_SECONDS,
    NOTIFICATION_PREFS_TTL_SECONDS,
)

logger = get_logger("nstil.cache.ai")


class AICacheService(BaseCacheService):

    async def get_context(
        self, user_id: UUID, entry_limit: int, days_back: int
    ) -> AIContextResponse | None:
        data = await self._get(ai_context_key(user_id, entry_limit, days_back))
        if data is None:
            return None
        return self._deserialize(AIContextResponse, data)

    async def set_context(
        self,
        user_id: UUID,
        entry_limit: int,
        days_back: int,
        context: AIContextResponse,
    ) -> None:
        await self._set(
            ai_context_key(user_id, entry_limit, days_back),
            self._serialize(context),
            AI_CONTEXT_TTL_SECONDS,
        )

    async def invalidate_context(self, user_id: UUID) -> None:
        pattern = ai_context_pattern(user_id)
        count = await self._delete_pattern(pattern)
        if count > 0:
            logger.debug(
                "cache.ai_context.invalidated",
                user_id=str(user_id),
                count=count,
            )

    async def get_profile(self, user_id: UUID) -> UserAIProfileRow | None:
        data = await self._get(ai_profile_key(user_id))
        if data is None:
            return None
        return self._deserialize(UserAIProfileRow, data)

    async def set_profile(
        self, user_id: UUID, profile: UserAIProfileRow
    ) -> None:
        await self._set(
            ai_profile_key(user_id),
            self._serialize(profile),
            AI_PROFILE_TTL_SECONDS,
        )

    async def invalidate_profile(self, user_id: UUID) -> None:
        await self._delete(ai_profile_key(user_id))

    async def get_notification_prefs(
        self, user_id: UUID
    ) -> NotificationPreferencesRow | None:
        data = await self._get(notification_prefs_key(user_id))
        if data is None:
            return None
        return self._deserialize(NotificationPreferencesRow, data)

    async def set_notification_prefs(
        self, user_id: UUID, prefs: NotificationPreferencesRow
    ) -> None:
        await self._set(
            notification_prefs_key(user_id),
            self._serialize(prefs),
            NOTIFICATION_PREFS_TTL_SECONDS,
        )

    async def invalidate_notification_prefs(self, user_id: UUID) -> None:
        await self._delete(notification_prefs_key(user_id))
