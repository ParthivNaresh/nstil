from pydantic import BaseModel, Field


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
