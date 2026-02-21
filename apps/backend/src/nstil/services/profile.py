from datetime import UTC, datetime
from uuid import UUID

from supabase import AsyncClient

from nstil.models.profile import ProfileRow, ProfileUpdate

TABLE = "profiles"


class ProfileService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get(self, user_id: UUID) -> ProfileRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return ProfileRow.model_validate(result.data[0])

    async def update(
        self, user_id: UUID, data: ProfileUpdate
    ) -> ProfileRow | None:
        update_data = data.to_update_dict()
        if not update_data:
            return await self.get(user_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(user_id))
            .execute()
        )
        if not result.data:
            return None
        return ProfileRow.model_validate(result.data[0])

    async def complete_onboarding(self, user_id: UUID) -> ProfileRow | None:
        result = await (
            self._client.table(TABLE)
            .update({"onboarding_completed_at": datetime.now(UTC).isoformat()})
            .eq("id", str(user_id))
            .execute()
        )
        if not result.data:
            return None
        return ProfileRow.model_validate(result.data[0])
