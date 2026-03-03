from typing import Any
from uuid import UUID

from postgrest.exceptions import APIError
from supabase import AsyncClient

from nstil.models.notification import NotificationPreferencesRow, NotificationPreferencesUpdate
from nstil.observability import get_logger

logger = get_logger("nstil.services.notification")

TABLE = "user_notification_preferences"


class NotificationService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get(self, user_id: UUID) -> NotificationPreferencesRow | None:
        result = await (
            self._client.table(TABLE).select("*").eq("user_id", str(user_id)).limit(1).execute()
        )
        if not result.data:
            return None
        return NotificationPreferencesRow.model_validate(result.data[0])

    async def get_or_create(self, user_id: UUID) -> NotificationPreferencesRow | None:
        existing = await self.get(user_id)
        if existing is not None:
            return existing

        try:
            result = await self._client.table(TABLE).insert({"user_id": str(user_id)}).execute()
            return NotificationPreferencesRow.model_validate(result.data[0])
        except APIError as exc:
            if "23503" in str(exc):
                logger.warning(
                    "notification.get_or_create.fk_violation",
                    user_id=str(user_id),
                )
                return None
            raise

    async def update(
        self, user_id: UUID, data: NotificationPreferencesUpdate
    ) -> NotificationPreferencesRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get(user_id)

        result = await (
            self._client.table(TABLE).update(update_data).eq("user_id", str(user_id)).execute()
        )
        if not result.data:
            return None
        return NotificationPreferencesRow.model_validate(result.data[0])

    async def update_last_notified(self, user_id: UUID, timestamp: str) -> None:
        await (
            self._client.table(TABLE)
            .update({"last_notified_at": timestamp})
            .eq("user_id", str(user_id))
            .execute()
        )
