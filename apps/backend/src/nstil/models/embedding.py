from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

MAX_EMBEDDING_DIMENSIONS = 4096


class EntryEmbeddingRow(BaseModel):
    id: UUID
    entry_id: UUID
    user_id: UUID
    model_id: str
    dimensions: int
    created_at: datetime
    updated_at: datetime

    model_config = {"extra": "ignore"}


class EntryEmbeddingCreate(BaseModel):
    entry_id: UUID = Field(...)
    model_id: str = Field(..., min_length=1, max_length=100)
    embedding: list[float] = Field(...)
    dimensions: int = Field(default=1536, ge=1, le=MAX_EMBEDDING_DIMENSIONS)


class EntryEmbeddingResponse(BaseModel):
    id: UUID
    entry_id: UUID
    model_id: str
    dimensions: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: EntryEmbeddingRow) -> "EntryEmbeddingResponse":
        return cls(
            id=row.id,
            entry_id=row.entry_id,
            model_id=row.model_id,
            dimensions=row.dimensions,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


class SemanticSearchResult(BaseModel):
    entry_id: UUID
    similarity: float
    title: str
    body: str
    mood_category: str | None
    mood_specific: str | None
    tags: list[str]
    entry_type: str
    created_at: datetime

    model_config = {"extra": "ignore"}


class SemanticSearchResponse(BaseModel):
    items: list[SemanticSearchResult]
    model_id: str
    query_dimensions: int
