from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class PromptStyle(StrEnum):
    GENTLE = "gentle"
    DIRECT = "direct"
    ANALYTICAL = "analytical"
    MOTIVATIONAL = "motivational"


MAX_TOPIC_LENGTH = 100
MAX_TOPICS_COUNT = 20
MAX_GOALS_COUNT = 10
MAX_GOAL_LENGTH = 500


class UserAIProfileRow(BaseModel):
    user_id: UUID
    ai_enabled: bool
    prompt_style: str
    topics_to_avoid: list[str]
    goals: list[dict[str, object]]
    last_check_in_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"extra": "ignore"}


class UserAIProfileUpdate(BaseModel):
    ai_enabled: bool | None = Field(default=None)
    prompt_style: PromptStyle | None = Field(default=None)
    topics_to_avoid: list[str] | None = Field(default=None)
    goals: list[dict[str, object]] | None = Field(default=None)

    @model_validator(mode="after")
    def at_least_one_field(self) -> "UserAIProfileUpdate":
        has_value = any(
            getattr(self, field) is not None
            for field in self.__class__.model_fields
        )
        if not has_value:
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return self

    @field_validator("topics_to_avoid")
    @classmethod
    def validate_topics(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        if len(v) > MAX_TOPICS_COUNT:
            msg = f"Maximum {MAX_TOPICS_COUNT} topics allowed"
            raise ValueError(msg)
        cleaned: list[str] = []
        for topic in v:
            stripped = topic.strip()
            if not stripped:
                continue
            if len(stripped) > MAX_TOPIC_LENGTH:
                msg = f"Topic must be at most {MAX_TOPIC_LENGTH} characters"
                raise ValueError(msg)
            cleaned.append(stripped)
        return cleaned

    @field_validator("goals")
    @classmethod
    def validate_goals(cls, v: list[dict[str, object]] | None) -> list[dict[str, object]] | None:
        if v is None:
            return None
        if len(v) > MAX_GOALS_COUNT:
            msg = f"Maximum {MAX_GOALS_COUNT} goals allowed"
            raise ValueError(msg)
        return v

    def to_update_dict(self) -> dict[str, str | bool | list[str] | list[dict[str, object]]]:
        return {
            k: v
            for k, v in self.model_dump(mode="json").items()
            if v is not None
        }


class UserAIProfileResponse(BaseModel):
    user_id: UUID
    ai_enabled: bool
    prompt_style: str
    topics_to_avoid: list[str]
    goals: list[dict[str, object]]
    last_check_in_at: datetime | None
    updated_at: datetime

    @classmethod
    def from_row(cls, row: UserAIProfileRow) -> "UserAIProfileResponse":
        return cls(
            user_id=row.user_id,
            ai_enabled=row.ai_enabled,
            prompt_style=row.prompt_style,
            topics_to_avoid=row.topics_to_avoid,
            goals=row.goals,
            last_check_in_at=row.last_check_in_at,
            updated_at=row.updated_at,
        )
