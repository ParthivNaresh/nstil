from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_DISPLAY_NAME_LENGTH = 100
MAX_CUSTOM_THEMES = 4
MAX_THEME_NAME_LENGTH = 20

VALID_THEME_MODES: frozenset[str] = frozenset(
    {"dark", "light", "oled", "auto", "custom", "sunset", "forest", "ocean", "rose"}
)


def _validate_display_name(v: str | None) -> str | None:
    if v is None:
        return None
    stripped = v.strip()
    return stripped or None


class CustomThemeInputModel(BaseModel):
    model_config = {"populate_by_name": True}

    background: str
    card_color: str = Field(alias="cardColor")
    text_primary: str = Field(alias="textPrimary")
    text_secondary: str = Field(alias="textSecondary")
    accent: str
    gradient1: str
    gradient2: str
    gradient3: str


class StoredCustomThemeModel(BaseModel):
    id: str
    name: str = Field(max_length=MAX_THEME_NAME_LENGTH)
    input: CustomThemeInputModel


class ProfileRow(BaseModel):
    id: UUID
    display_name: str | None
    avatar_url: str | None
    onboarding_completed_at: datetime | None
    theme_mode: str
    custom_themes: list[dict[str, object]]
    active_custom_theme_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"extra": "ignore"}


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=MAX_DISPLAY_NAME_LENGTH)
    theme_mode: str | None = Field(default=None)
    custom_themes: list[StoredCustomThemeModel] | None = Field(default=None)
    active_custom_theme_id: str | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "ProfileUpdate":
        if not self.model_fields_set:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    @field_validator("theme_mode")
    @classmethod
    def validate_theme_mode(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_THEME_MODES:
            msg = f"Invalid theme mode: {v}"
            raise ValueError(msg)
        return v

    @field_validator("custom_themes")
    @classmethod
    def validate_custom_themes(
        cls,
        v: list[StoredCustomThemeModel] | None,
    ) -> list[StoredCustomThemeModel] | None:
        if v is not None and len(v) > MAX_CUSTOM_THEMES:
            msg = f"Maximum {MAX_CUSTOM_THEMES} custom themes allowed"
            raise ValueError(msg)
        return v

    _strip_display_name = field_validator("display_name")(_validate_display_name)

    def to_update_dict(self) -> dict[str, object]:
        result: dict[str, object] = {}
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
    theme_mode: str
    custom_themes: list[dict[str, object]]
    active_custom_theme_id: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: ProfileRow) -> "ProfileResponse":
        return cls(
            id=row.id,
            display_name=row.display_name,
            avatar_url=row.avatar_url,
            onboarding_completed_at=row.onboarding_completed_at,
            theme_mode=row.theme_mode,
            custom_themes=row.custom_themes,
            active_custom_theme_id=row.active_custom_theme_id,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
