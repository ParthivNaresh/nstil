from datetime import UTC, datetime
from uuid import UUID

from supabase import AsyncClient

from nstil.models.journal import JournalEntryCreate, JournalEntryRow, JournalEntryUpdate
from nstil.models.pagination import CursorParams

TABLE = "journal_entries"


class JournalService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: JournalEntryCreate) -> JournalEntryRow:
        payload = {
            "user_id": str(user_id),
            "title": data.title,
            "body": data.body,
            "mood_score": data.mood_score,
            "tags": data.tags,
            "location": data.location,
            "entry_type": data.entry_type.value,
        }
        result = await (
            self._client.table(TABLE)
            .insert(payload)
            .execute()
        )
        return JournalEntryRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, entry_id: UUID) -> JournalEntryRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(entry_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return JournalEntryRow.model_validate(result.data[0])

    async def list(
        self, user_id: UUID, params: CursorParams
    ) -> tuple[list[JournalEntryRow], bool]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )

        if params.cursor:
            query = query.lt("created_at", params.cursor)

        result = await query.execute()
        rows = [JournalEntryRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def update(
        self, user_id: UUID, entry_id: UUID, data: JournalEntryUpdate
    ) -> JournalEntryRow | None:
        update_data = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, entry_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(entry_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return JournalEntryRow.model_validate(result.data[0])

    async def soft_delete(self, user_id: UUID, entry_id: UUID) -> bool:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"deleted_at": now})
            .eq("id", str(entry_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        return len(result.data) > 0
