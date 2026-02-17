from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_task import AIAgentTaskCreate, AIAgentTaskRow, AIAgentTaskUpdate

TABLE = "ai_agent_tasks"


class AITaskService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def enqueue(self, data: AIAgentTaskCreate) -> AIAgentTaskRow:
        payload: dict[str, Any] = {
            "user_id": str(data.user_id),
            "task_type": data.task_type.value,
            "priority": data.priority,
            "input": data.input,
            "session_id": str(data.session_id) if data.session_id else None,
            "max_attempts": data.max_attempts,
            "scheduled_for": (
                data.scheduled_for.isoformat()
                if data.scheduled_for
                else datetime.now(UTC).isoformat()
            ),
        }
        result = await self._client.table(TABLE).insert(payload).execute()
        return AIAgentTaskRow.model_validate(result.data[0])

    async def get_by_id(self, task_id: UUID) -> AIAgentTaskRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(task_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return AIAgentTaskRow.model_validate(result.data[0])

    async def claim_next(self) -> AIAgentTaskRow | None:
        now = datetime.now(UTC).isoformat()
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("status", "pending")
            .lte("scheduled_for", now)
            .order("priority", desc=True)
            .order("scheduled_for")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None

        task = AIAgentTaskRow.model_validate(result.data[0])
        update_result = await (
            self._client.table(TABLE)
            .update({
                "status": "running",
                "started_at": now,
                "attempts": task.attempts + 1,
            })
            .eq("id", str(task.id))
            .eq("status", "pending")
            .execute()
        )
        if not update_result.data:
            return None
        return AIAgentTaskRow.model_validate(update_result.data[0])

    async def update(self, task_id: UUID, data: AIAgentTaskUpdate) -> AIAgentTaskRow | None:
        update_data: dict[str, Any] = data.to_update_dict()
        if not update_data:
            return await self.get_by_id(task_id)

        result = await (
            self._client.table(TABLE)
            .update(update_data)
            .eq("id", str(task_id))
            .execute()
        )
        if not result.data:
            return None
        return AIAgentTaskRow.model_validate(result.data[0])

    async def mark_completed(
        self, task_id: UUID, output: dict[str, object] | None = None
    ) -> AIAgentTaskRow | None:
        now = datetime.now(UTC).isoformat()
        payload: dict[str, Any] = {
            "status": "completed",
            "completed_at": now,
        }
        if output is not None:
            payload["output"] = output
        result = await (
            self._client.table(TABLE)
            .update(payload)
            .eq("id", str(task_id))
            .execute()
        )
        if not result.data:
            return None
        return AIAgentTaskRow.model_validate(result.data[0])

    async def mark_failed(self, task_id: UUID, error: str) -> AIAgentTaskRow | None:
        result = await (
            self._client.table(TABLE)
            .update({"status": "failed", "error": error})
            .eq("id", str(task_id))
            .execute()
        )
        if not result.data:
            return None
        return AIAgentTaskRow.model_validate(result.data[0])

    async def list_by_user(
        self,
        user_id: UUID,
        status: str | None = None,
        limit: int = 20,
    ) -> list[AIAgentTaskRow]:
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit)
        )
        if status is not None:
            query = query.eq("status", status)

        result = await query.execute()
        return [AIAgentTaskRow.model_validate(row) for row in result.data]
