from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_DISPLAY_NAME_LENGTH = 100


def _validate_display_name(v: str | None) -> str | None:
    if v is None:
        return None
    stripped = v.strip()
    return stripped or None


class ProfileRow(BaseModel):
    id: UUID
    display_name: str | None
    avatar_url: str | None
    onboarding_completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"extra": "ignore"}


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=MAX_DISPLAY_NAME_LENGTH)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "ProfileUpdate":
        if not self.model_fields_set:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    _strip_display_name = field_validator("display_name")(_validate_display_name)

    def to_update_dict(self) -> dict[str, str | None]:
        result: dict[str, str | None] = {}
        for k, v in self.model_dump(mode="json").items():
            if k not in self.model_fields_set:
                continue
            result[k] = v
        return result


class ProfileResponse(BaseModel):
    id: UUID
    display_name: str | None
    avatar_url: str | None
    onboarding_completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: ProfileRow) -> "ProfileResponse":
        return cls(
            id=row.id,
            display_name=row.display_name,
            avatar_url=row.avatar_url,
            onboarding_completed_at=row.onboarding_completed_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
