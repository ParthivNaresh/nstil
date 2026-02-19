from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_profile import UserAIProfileRow, UserAIProfileUpdate

TABLE = "user_ai_profiles"


class AIProfileService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get(self, user_id: UUID) -> UserAIProfileRow | None:
        result = await (
            self._client.table(TABLE).select("*").eq("user_id", str(user_id)).limit(1).execute()
        )
        if not result.data:
            return None
        return UserAIProfileRow.model_validate(result.data[0])

    async def update(self, user_id: UUID, data: UserAIProfileUpdate) -> UserAIProfileRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get(user_id)

        result = await (
            self._client.table(TABLE).update(update_data).eq("user_id", str(user_id)).execute()
        )
        if not result.data:
            return None
        return UserAIProfileRow.model_validate(result.data[0])

    async def update_last_check_in(self, user_id: UUID, timestamp: str) -> None:
        await (
            self._client.table(TABLE)
            .update({"last_check_in_at": timestamp})
            .eq("user_id", str(user_id))
            .execute()
        )
