from datetime import UTC, datetime
from uuid import UUID

from postgrest.exceptions import APIError
from supabase import AsyncClient

from nstil.core.exceptions import ProfileCreationError
from nstil.models.profile import ProfileRow, ProfileUpdate

TABLE = "profiles"

FK_VIOLATION_CODE = "23503"


class ProfileService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get(self, user_id: UUID) -> ProfileRow | None:
        result = await (
            self._client.table(TABLE).select("*").eq("id", str(user_id)).limit(1).execute()
        )
        if not result.data:
            return None
        return ProfileRow.model_validate(result.data[0])

    async def ensure(self, user_id: UUID) -> ProfileRow:
        existing = await self.get(user_id)
        if existing is not None:
            return existing

        try:
            result = await (
                self._client.table(TABLE)
                .upsert({"id": str(user_id)}, on_conflict="id")
                .execute()
            )
        except APIError as exc:
            if exc.code == FK_VIOLATION_CODE:
                raise ProfileCreationError(
                    f"Auth user {user_id} not found in database"
                ) from exc
            raise
        return ProfileRow.model_validate(result.data[0])

    async def update(self, user_id: UUID, data: ProfileUpdate) -> ProfileRow | None:
        update_data = data.to_update_dict()
        if not update_data:
            return await self.get(user_id)

        result = await (
            self._client.table(TABLE).update(update_data).eq("id", str(user_id)).execute()
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
