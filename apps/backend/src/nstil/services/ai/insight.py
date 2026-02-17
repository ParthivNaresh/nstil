from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_insight import AIInsightCreate, AIInsightRow, AIInsightUpdate
from nstil.models.pagination import CursorParams

TABLE = "ai_insights"


class AIInsightService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: AIInsightCreate) -> AIInsightRow:
        payload: dict[str, Any] = {
            "user_id": str(user_id),
            "insight_type": data.insight_type.value,
            "title": data.title,
            "content": data.content,
            "supporting_entry_ids": [str(eid) for eid in data.supporting_entry_ids],
            "source": data.source.value,
            "model_id": data.model_id,
            "confidence": data.confidence,
            "period_start": data.period_start.isoformat() if data.period_start else None,
            "period_end": data.period_end.isoformat() if data.period_end else None,
            "session_id": str(data.session_id) if data.session_id else None,
            "metadata": data.metadata,
            "expires_at": data.expires_at.isoformat() if data.expires_at else None,
        }
        result = await self._client.table(TABLE).insert(payload).execute()
        return AIInsightRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, insight_id: UUID) -> AIInsightRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(insight_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return AIInsightRow.model_validate(result.data[0])

    async def list_insights(
        self,
        user_id: UUID,
        params: CursorParams,
        insight_type: str | None = None,
        status: str | None = None,
    ) -> tuple[list[AIInsightRow], bool]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .is_("superseded_by", "null")
            .order("created_at", desc=True)
            .limit(params.limit + 1)
        )
        if insight_type is not None:
            query = query.eq("insight_type", insight_type)
        if status is not None:
            query = query.eq("status", status)
        if params.cursor:
            query = query.lt("created_at", params.cursor)

        result = await query.execute()
        rows = [AIInsightRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def list_by_period(
        self,
        user_id: UUID,
        period_start: date,
        period_end: date,
        insight_type: str | None = None,
    ) -> list[AIInsightRow]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .is_("superseded_by", "null")
            .gte("period_start", period_start.isoformat())
            .lte("period_end", period_end.isoformat())
            .order("created_at", desc=True)
        )
        if insight_type is not None:
            query = query.eq("insight_type", insight_type)

        result = await query.execute()
        return [AIInsightRow.model_validate(row) for row in result.data]

    async def update(
        self, user_id: UUID, insight_id: UUID, data: AIInsightUpdate
    ) -> AIInsightRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, insight_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(insight_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        if not result.data:
            return None
        return AIInsightRow.model_validate(result.data[0])

    async def supersede(
        self, user_id: UUID, old_insight_id: UUID, new_insight: AIInsightCreate
    ) -> AIInsightRow:
        new_row = await self.create(user_id, new_insight)
        await (
            self._client.table(TABLE)
            .update({"superseded_by": str(new_row.id)})
            .eq("id", str(old_insight_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        return new_row

    async def soft_delete(self, user_id: UUID, insight_id: UUID) -> bool:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .update({"deleted_at": now})
            .eq("id", str(insight_id))
            .eq("user_id", str(user_id))
            .is_("deleted_at", "null")
            .execute()
        )
        return len(result.data) > 0
