import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_NAME_LENGTH = 100
MAX_DESCRIPTION_LENGTH = 500
HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


def _validate_name(v: str | None) -> str | None:
    if v is None:
        return None
    stripped = v.strip()
    if not stripped:
        msg = "Name must not be blank"
        raise ValueError(msg)
    return stripped


def _validate_description(v: str | None) -> str | None:
    if v is None:
        return None
    return v.strip() or None


def _validate_hex_color(v: str | None) -> str | None:
    if v is None:
        return None
    if not HEX_COLOR_PATTERN.match(v):
        msg = "Color must be a valid hex color (e.g. #FF6B6B)"
        raise ValueError(msg)
    return v.upper()


def _validate_icon(v: str | None) -> str | None:
    if v is None:
        return None
    stripped = v.strip().lower()
    return stripped or None


class JournalSpaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_NAME_LENGTH)
    description: str | None = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)
    color: str | None = Field(default=None)
    icon: str | None = Field(default=None)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        result = _validate_name(v)
        if result is None:
            msg = "Name must not be blank"
            raise ValueError(msg)
        return result

    _strip_description = field_validator("description")(_validate_description)
    _validate_color = field_validator("color")(_validate_hex_color)
    _strip_icon = field_validator("icon")(_validate_icon)


class JournalSpaceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)
    description: str | None = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)
    color: str | None = Field(default=None)
    icon: str | None = Field(default=None)
    sort_order: int | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "JournalSpaceUpdate":
        has_value = any(
            getattr(self, field) is not None
            for field in self.__class__.model_fields
        )
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    _strip_name = field_validator("name")(_validate_name)
    _strip_description = field_validator("description")(_validate_description)
    _validate_color = field_validator("color")(_validate_hex_color)
    _strip_icon = field_validator("icon")(_validate_icon)

    def to_update_dict(self) -> dict[str, str | int]:
        return {
            k: v
            for k, v in self.model_dump(mode="json").items()
            if v is not None
        }


class JournalSpaceRow(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    color: str | None
    icon: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"extra": "ignore"}


class JournalSpaceResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    color: str | None
    icon: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: JournalSpaceRow) -> "JournalSpaceResponse":
        return cls(
            id=row.id,
            user_id=row.user_id,
            name=row.name,
            description=row.description,
            color=row.color,
            icon=row.icon,
            sort_order=row.sort_order,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


class JournalSpaceListResponse(BaseModel):
    items: list[JournalSpaceResponse]
