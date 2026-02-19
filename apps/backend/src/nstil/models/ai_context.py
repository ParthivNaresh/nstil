from datetime import datetime

from pydantic import BaseModel


class AIContextEntry(BaseModel):
    id: str
    title: str
    body: str
    mood_category: str | None
    mood_specific: str | None
    tags: list[str]
    entry_type: str
    location: str | None
    journal_name: str
    created_at: datetime


class AIContextMoodDistribution(BaseModel):
    mood_category: str
    mood_specific: str | None
    count: int


class AIContextPrompt(BaseModel):
    prompt_type: str
    content: str
    status: str
    source: str
    created_at: datetime


class AIContextSession(BaseModel):
    id: str
    session_type: str
    status: str
    trigger_source: str | None
    created_at: datetime
    completed_at: datetime | None


class AIContextStats(BaseModel):
    total_entries: int
    entries_last_7d: int
    check_ins_total: int
    check_ins_last_7d: int
    avg_entry_length_7d: int | None
    last_entry_at: datetime | None


class AIContextProfile(BaseModel):
    prompt_style: str
    topics_to_avoid: list[str]
    goals: list[dict[str, object]]


class AIContextResponse(BaseModel):
    recent_entries: list[AIContextEntry]
    mood_distribution: list[AIContextMoodDistribution]
    recent_prompts: list[AIContextPrompt]
    recent_sessions: list[AIContextSession]
    stats: AIContextStats
    profile: AIContextProfile
