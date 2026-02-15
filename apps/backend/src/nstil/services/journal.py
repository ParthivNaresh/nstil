from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.journal import JournalEntryCreate, JournalEntryRow, JournalEntryUpdate
from nstil.models.pagination import CursorParams, SearchParams

TABLE = "journal_entries"


class JournalService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: JournalEntryCreate) -> JournalEntryRow:
        payload: dict[str, str | int | bool | list[str] | None] = {
            "user_id": str(user_id),
            "journal_id": str(data.journal_id),
            "title": data.title,
            "body": data.body,
            "mood_category": data.mood_category.value if data.mood_category else None,
            "mood_specific": data.mood_specific.value if data.mood_specific else None,
            "tags": data.tags,
            "location": data.location,
            "entry_type": data.entry_type.value,
            "is_pinned": data.is_pinned,
        }
        if data.created_at is not None:
            payload["created_at"] = data.created_at.isoformat()
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

    async def list_entries(
        self,
        user_id: UUID,
        params: CursorParams,
        journal_id: UUID | None = None,
    ) -> tuple[list[JournalEntryRow], bool]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("is_pinned", desc=True)
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )

        if journal_id is not None:
            query = query.eq("journal_id", str(journal_id))

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

    async def search(
        self,
        user_id: UUID,
        params: SearchParams,
        journal_id: UUID | None = None,
    ) -> tuple[list[JournalEntryRow], bool]:
        rpc_params: dict[str, str | int] = {
            "p_user_id": str(user_id),
            "p_query": params.query,
            "p_limit": params.limit + 1,
        }
        if params.cursor:
            rpc_params["p_cursor"] = params.cursor
        if journal_id is not None:
            rpc_params["p_journal_id"] = str(journal_id)

        result = await self._client.rpc(
            "search_journal_entries", rpc_params
        ).execute()

        data: list[dict[str, Any]] = result.data  # type: ignore[assignment]
        rows = [JournalEntryRow.model_validate(row) for row in data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

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
