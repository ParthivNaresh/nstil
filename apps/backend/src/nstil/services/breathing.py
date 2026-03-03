from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.breathing import (
    BreathingSessionCreate,
    BreathingSessionRow,
    BreathingSessionUpdate,
    BreathingStatsResponse,
)
from nstil.models.pagination import CursorParams

TABLE = "breathing_sessions"


class BreathingService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, user_id: UUID, data: BreathingSessionCreate) -> BreathingSessionRow:
        payload: dict[str, Any] = {
            "user_id": str(user_id),
            "pattern": data.pattern.value,
            "duration_seconds": data.duration_seconds,
            "cycles_target": data.cycles_target,
            "mood_before": data.mood_before.value if data.mood_before else None,
        }
        result = await self._client.table(TABLE).insert(payload).execute()
        return BreathingSessionRow.model_validate(result.data[0])

    async def get_by_id(self, user_id: UUID, session_id: UUID) -> BreathingSessionRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return BreathingSessionRow.model_validate(result.data[0])

    async def complete(
        self, user_id: UUID, session_id: UUID, data: BreathingSessionUpdate
    ) -> BreathingSessionRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(user_id, session_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        if not result.data:
            return None
        return BreathingSessionRow.model_validate(result.data[0])

    async def list_recent(
        self, user_id: UUID, params: CursorParams
    ) -> tuple[list[BreathingSessionRow], bool]:
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
        rows = [BreathingSessionRow.model_validate(row) for row in result.data]

        has_more = len(rows) > params.limit
        if has_more:
            rows = rows[: params.limit]

        return rows, has_more

    async def get_stats(self, user_id: UUID) -> BreathingStatsResponse:
        result = await (
            self._client.table(TABLE)
            .select("duration_seconds,completed,created_at")
            .eq("user_id", str(user_id))
            .execute()
        )

        total_sessions = 0
        completed_sessions = 0
        total_seconds = 0
        sessions_this_week = 0
        week_ago = datetime.now(UTC) - timedelta(days=7)

        for row_data in result.data:
            raw: dict[str, Any] = row_data  # type: ignore[assignment]
            total_sessions += 1
            if raw["completed"]:
                completed_sessions += 1
            total_seconds += int(raw["duration_seconds"])
            created = datetime.fromisoformat(str(raw["created_at"]))
            if created >= week_ago:
                sessions_this_week += 1

        return BreathingStatsResponse(
            total_sessions=total_sessions,
            completed_sessions=completed_sessions,
            total_minutes=total_seconds // 60,
            sessions_this_week=sessions_this_week,
        )
