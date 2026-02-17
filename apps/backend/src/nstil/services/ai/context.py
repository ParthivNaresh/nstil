from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.ai_context import AIContextResponse


class AIContextService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get_context(
        self,
        user_id: UUID,
        entry_limit: int = 10,
        days_back: int = 14,
    ) -> AIContextResponse:
        rpc_params: dict[str, str | int] = {
            "p_user_id": str(user_id),
            "p_entry_limit": entry_limit,
            "p_days_back": days_back,
        }
        result = await self._client.rpc("get_ai_context", rpc_params).execute()
        data: dict[str, Any] = result.data  # type: ignore[assignment]
        return AIContextResponse.model_validate(data)
