from typing import Any
from uuid import UUID

from supabase import AsyncClient

from nstil.models.embedding import EntryEmbeddingCreate, EntryEmbeddingRow, SemanticSearchResult

TABLE = "entry_embeddings"


class EmbeddingService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def upsert(self, user_id: UUID, data: EntryEmbeddingCreate) -> EntryEmbeddingRow:
        payload: dict[str, Any] = {
            "entry_id": str(data.entry_id),
            "user_id": str(user_id),
            "model_id": data.model_id,
            "embedding": data.embedding,
            "dimensions": data.dimensions,
        }
        result = await (
            self._client.table(TABLE).upsert(payload, on_conflict="entry_id,model_id").execute()
        )
        return EntryEmbeddingRow.model_validate(result.data[0])

    async def get_by_entry(
        self, entry_id: UUID, model_id: str | None = None
    ) -> list[EntryEmbeddingRow]:
        query = self._client.table(TABLE).select("*").eq("entry_id", str(entry_id))
        if model_id is not None:
            query = query.eq("model_id", model_id)

        result = await query.execute()
        return [EntryEmbeddingRow.model_validate(row) for row in result.data]

    async def delete_by_entry(self, entry_id: UUID, model_id: str | None = None) -> int:
        query = self._client.table(TABLE).delete().eq("entry_id", str(entry_id))
        if model_id is not None:
            query = query.eq("model_id", model_id)

        result = await query.execute()
        return len(result.data)

    async def semantic_search(
        self,
        user_id: UUID,
        embedding: list[float],
        model_id: str,
        match_count: int = 10,
        similarity_threshold: float = 0.5,
    ) -> list[SemanticSearchResult]:
        rpc_params: dict[str, str | int | float | list[float]] = {
            "p_user_id": str(user_id),
            "p_embedding": embedding,
            "p_model_id": model_id,
            "p_match_count": match_count,
            "p_similarity_threshold": similarity_threshold,
        }
        result = await self._client.rpc("semantic_search", rpc_params).execute()
        data: list[dict[str, Any]] = result.data  # type: ignore[assignment]
        return [SemanticSearchResult.model_validate(row) for row in data]

    async def count_by_user(self, user_id: UUID, model_id: str | None = None) -> int:
        query = (
            self._client.table(TABLE)
            .select("id", count="exact")  # type: ignore[arg-type]
            .eq("user_id", str(user_id))
        )
        if model_id is not None:
            query = query.eq("model_id", model_id)

        result = await query.execute()
        return result.count or 0

    async def list_unembedded_entries(
        self, user_id: UUID, model_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        result = await self._client.rpc(
            "get_unembedded_entries",
            {
                "p_user_id": str(user_id),
                "p_model_id": model_id,
                "p_limit": limit,
            },
        ).execute()
        data: list[dict[str, Any]] = result.data  # type: ignore[assignment]
        return data
