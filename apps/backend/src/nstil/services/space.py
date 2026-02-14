from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.space import JournalSpaceCreate, JournalSpaceRow, JournalSpaceUpdate

TABLE = "journals"


class JournalSpaceService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: JournalSpaceCreate) -> JournalSpaceRow:
        payload: dict[str, str | int | None] = {
            "user_id": str(user_id),
            "name": data.name,
            "description": data.description,
            "color": data.color,
            "icon": data.icon,
        }
        result = await (
            self._client.table(TABLE)
            .insert(payload)
            .execute()
        )
        return JournalSpaceRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, space_id: UUID) -> JournalSpaceRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(space_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return JournalSpaceRow.model_validate(result.data[0])

    async def list_spaces(self, user_id: UUID) -> list[JournalSpaceRow]:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("sort_order")
            .order("created_at")
            .execute()
        )
        return [JournalSpaceRow.model_validate(row) for row in result.data]

    async def update(
        self, user_id: UUID, space_id: UUID, data: JournalSpaceUpdate
    ) -> JournalSpaceRow | None:
        update_data = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, space_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(space_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return JournalSpaceRow.model_validate(result.data[0])

    async def soft_delete(self, user_id: UUID, space_id: UUID) -> bool:
        result = await self._client.rpc(
            "soft_delete_journal",
            {"p_user_id": str(user_id), "p_journal_id": str(space_id)},
        ).execute()
        data: Any = result.data
        return bool(data)

    async def get_default(self, user_id: UUID) -> JournalSpaceRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("sort_order")
            .order("created_at")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return JournalSpaceRow.model_validate(result.data[0])
