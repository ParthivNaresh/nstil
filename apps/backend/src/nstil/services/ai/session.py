from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_message import AIMessageCreate, AIMessageRow
from nstil.models.ai_session import AISessionCreate, AISessionRow, AISessionUpdate
from nstil.models.pagination import CursorParams

SESSIONS_TABLE = "ai_sessions"
MESSAGES_TABLE = "ai_messages"


class AISessionService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: AISessionCreate) -> AISessionRow:
        payload: dict[str, Any] = {
            "user_id": str(user_id),
            "session_type": data.session_type.value,
            "trigger_source": data.trigger_source.value if data.trigger_source else None,
            "parent_session_id": str(data.parent_session_id) if data.parent_session_id else None,
            "entry_id": str(data.entry_id) if data.entry_id else None,
            "model_id": data.model_id,
            "flow_state": data.flow_state,
            "metadata": data.metadata,
        }
        result = await self._client.table(SESSIONS_TABLE).insert(payload).execute()
        return AISessionRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, session_id: UUID) -> AISessionRow | None:
        result = await (
            self._client.table(SESSIONS_TABLE)
            .select("*")
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return AISessionRow.model_validate(result.data[0])

    async def list_sessions(
        self,
        user_id: UUID,
        params: CursorParams,
        session_type: str | None = None,
        status: str | None = None,
    ) -> tuple[list[AISessionRow], bool]:
        query = (
            self._client.table(SESSIONS_TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )
        if session_type is not None:
            query = query.eq("session_type", session_type)
        if status is not None:
            query = query.eq("status", status)
        if params.cursor:
            query = query.lt("created_at", params.cursor)

        result = await query.execute()
        rows = [AISessionRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def update(
        self, user_id: UUID, session_id: UUID, data: AISessionUpdate
    ) -> AISessionRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, session_id)

        result = await (
            self._client.table(SESSIONS_TABLE)
            .update(update_data)
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AISessionRow.model_validate(result.data[0])

    async def soft_delete(self, user_id: UUID, session_id: UUID) -> bool:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(SESSIONS_TABLE)
            .update({"deleted_at": now})
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        return len(result.data) > 0

    async def add_message(self, user_id: UUID, data: AIMessageCreate) -> AIMessageRow:
        payload: dict[str, Any] = {
            "session_id": str(data.session_id),
            "user_id": str(user_id),
            "role": data.role.value,
            "content": data.content,
            "sort_order": data.sort_order,
            "token_count": data.token_count,
            "latency_ms": data.latency_ms,
            "model_id": data.model_id,
            "metadata": data.metadata,
        }
        result = await self._client.table(MESSAGES_TABLE).insert(payload).execute()
        return AIMessageRow.model_validate(result.data[0])

    async def get_messages(self, user_id: UUID, session_id: UUID) -> list[AIMessageRow]:
        result = await (
            self._client.table(MESSAGES_TABLE)
            .select("*")
            .eq("session_id", str(session_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("sort_order")
            .execute()
        )
        return [AIMessageRow.model_validate(row) for row in result.data]

    async def get_next_sort_order(self, session_id: UUID) -> int:
        result = await (
            self._client.table(MESSAGES_TABLE)
            .select("sort_order")
            .eq("session_id", str(session_id))
            .is_("deleted_at", "null")
            .order("sort_order", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return 0
        row: dict[str, Any] = result.data[0]  # type: ignore[assignment]
        last_order: int = row["sort_order"]
        return last_order + 1
