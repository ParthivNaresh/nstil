from pydantic import BaseModel, Field, field_validator


class CursorParams(BaseModel):
    cursor: str | None = Field(
        default=None,
        description="ISO 8601 timestamp cursor for pagination",
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of items per page",
    )


MAX_SEARCH_QUERY_LENGTH = 200


class SearchParams(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_SEARCH_QUERY_LENGTH)
    cursor: str | None = Field(default=None)
    limit: int = Field(default=20, ge=1, le=100)

    @field_validator("query")
    @classmethod
    def strip_query(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            msg = "Search query must not be blank"
            raise ValueError(msg)
        return stripped
