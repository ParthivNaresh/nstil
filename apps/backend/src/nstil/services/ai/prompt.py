from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_prompt import AIPromptCreate, AIPromptRow, AIPromptUpdate
from nstil.models.pagination import CursorParams

TABLE = "ai_prompts"


class AIPromptService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: AIPromptCreate) -> AIPromptRow:
        payload: dict[str, Any] = {
            "user_id": str(user_id),
            "prompt_type": data.prompt_type.value,
            "content": data.content,
            "source": data.source.value,
            "mood_category": data.mood_category.value if data.mood_category else None,
            "session_id": str(data.session_id) if data.session_id else None,
            "entry_id": str(data.entry_id) if data.entry_id else None,
            "context": data.context,
        }
        result = await self._client.table(TABLE).insert(payload).execute()
        return AIPromptRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, prompt_id: UUID) -> AIPromptRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def get_by_entry_id(
        self,
        user_id: UUID,
        entry_id: UUID,
        prompt_type: str | None = None,
    ) -> AIPromptRow | None:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .eq("entry_id", str(entry_id))
            .is_("deleted_at", "null")
            .neq("status", "dismissed")
            .order("created_at", desc=True)
            .limit(1)
        )
        if prompt_type is not None:
            query = query.eq("prompt_type", prompt_type)
        result = await query.execute()
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def list_prompts(
        self,
        user_id: UUID,
        params: CursorParams,
        prompt_type: str | None = None,
        status: str | None = None,
        source: str | None = None,
        entry_id: UUID | None = None,
    ) -> tuple[list[AIPromptRow], bool]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )
        if prompt_type is not None:
            query = query.eq("prompt_type", prompt_type)
        if status is not None:
            query = query.eq("status", status)
        if source is not None:
            query = query.eq("source", source)
        if entry_id is not None:
            query = query.eq("entry_id", str(entry_id))
        if params.cursor:
            query = query.lt("created_at", params.cursor)

        result = await query.execute()
        rows = [AIPromptRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def update(
        self, user_id: UUID, prompt_id: UUID, data: AIPromptUpdate
    ) -> AIPromptRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, prompt_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def mark_delivered(self, user_id: UUID, prompt_id: UUID) -> AIPromptRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"status": "delivered", "delivered_at": now})
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def mark_seen(self, user_id: UUID, prompt_id: UUID) -> AIPromptRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"status": "seen", "seen_at": now})
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def mark_engaged(self, user_id: UUID, prompt_id: UUID) -> AIPromptRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"status": "engaged", "engaged_at": now})
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def mark_dismissed(self, user_id: UUID, prompt_id: UUID) -> AIPromptRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"status": "dismissed", "dismissed_at": now})
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def mark_converted(
        self, user_id: UUID, prompt_id: UUID, entry_id: UUID
    ) -> AIPromptRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update(
                {
                    "status": "converted",
                    "converted_at": now,
                    "converted_entry_id": str(entry_id),
                }
            )
            .eq("id", str(prompt_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIPromptRow.model_validate(result.data[0])

    async def get_recent_content(self, user_id: UUID, limit: int = 20) -> list[str]:
        result = await (
            self._client.table(TABLE)
            .select("content")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        data: list[dict[str, Any]] = result.data  # type: ignore[assignment]
        return [row["content"] for row in data]
