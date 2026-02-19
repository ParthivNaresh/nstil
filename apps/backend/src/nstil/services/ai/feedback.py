from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_feedback import AIFeedbackCreate, AIFeedbackRow
from nstil.models.pagination import CursorParams

TABLE = "ai_feedback"


class AIFeedbackService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: AIFeedbackCreate) -> AIFeedbackRow:
        payload: dict[str, Any] = {
            "user_id": str(user_id),
            "target_type": data.target_type.value,
            "target_id": str(data.target_id),
            "rating": data.rating,
            "reason": data.reason,
            "metadata": data.metadata,
        }
        result = await self._client.table(TABLE).insert(payload).execute()
        return AIFeedbackRow.model_validate(result.data[0])

    async def list_by_user(
        self,
        user_id: UUID,
        params: CursorParams,
    ) -> tuple[list[AIFeedbackRow], bool]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )
        if params.cursor:
            query = query.lt("created_at", params.cursor)

        result = await query.execute()
        rows = [AIFeedbackRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def list_by_target(
        self,
        target_type: str,
        target_id: UUID,
    ) -> list[AIFeedbackRow]:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("target_type", target_type)
            .eq("target_id", str(target_id))
            .order("created_at", desc=True)
            .execute()
        )
        return [AIFeedbackRow.model_validate(row) for row in result.data]
