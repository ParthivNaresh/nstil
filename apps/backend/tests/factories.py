import time
import uuid
from datetime import UTC, datetime
from datetime import time as dt_time

from jose import jwt  # type: ignore[import-untyped]

from nstil.models.ai_feedback import AIFeedbackRow
from nstil.models.ai_insight import AIInsightRow
from nstil.models.ai_message import AIMessageRow
from nstil.models.ai_profile import UserAIProfileRow
from nstil.models.ai_prompt import AIPromptRow
from nstil.models.ai_session import AISessionRow
from nstil.models.ai_task import AIAgentTaskRow
from nstil.models.journal import JournalEntryRow
from nstil.models.media import EntryMediaRow
from nstil.models.notification import NotificationPreferencesRow, ReminderTime
from nstil.models.space import JournalSpaceRow

DEFAULT_SECRET = "test-secret"
DEFAULT_ALGORITHM = "HS256"
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_JOURNAL_ID = "00000000-0000-0000-0000-000000000010"


def build_jwt_claims(**overrides: object) -> dict[str, object]:
    defaults: dict[str, object] = {
        "sub": DEFAULT_USER_ID,
        "email": "test@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "iss": "http://localhost:54321/auth/v1",
    }
    defaults.update(overrides)
    return defaults


def make_token(
    *,
    secret: str = DEFAULT_SECRET,
    algorithm: str = DEFAULT_ALGORITHM,
    **overrides: object,
) -> str:
    claims = build_jwt_claims(**overrides)
    token: str = jwt.encode(claims, secret, algorithm=algorithm)
    return token


def make_entry_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    journal_id: str = DEFAULT_JOURNAL_ID,
    entry_id: str | None = None,
    title: str = "Test Entry",
    body: str = "This is a test journal entry.",
    mood_category: str | None = "calm",
    mood_specific: str | None = None,
    tags: list[str] | None = None,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    entry_type: str = "journal",
    is_pinned: bool = False,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> JournalEntryRow:
    now = datetime.now(UTC)
    return JournalEntryRow(
        id=uuid.UUID(entry_id) if entry_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        journal_id=uuid.UUID(journal_id),
        title=title,
        body=body,
        mood_category=mood_category,
        mood_specific=mood_specific,
        tags=tags or [],
        location=location,
        latitude=latitude,
        longitude=longitude,
        entry_type=entry_type,
        is_pinned=is_pinned,
        metadata={},
        created_at=created_at or now,
        updated_at=updated_at or now,
        deleted_at=deleted_at,
    )


def make_media_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    entry_id: str | None = None,
    media_id: str | None = None,
    storage_path: str | None = None,
    file_name: str = "photo.jpg",
    content_type: str = "image/jpeg",
    size_bytes: int = 1024,
    width: int | None = 800,
    height: int | None = 600,
    duration_ms: int | None = None,
    waveform: list[float] | None = None,
    sort_order: int = 0,
    created_at: datetime | None = None,
) -> EntryMediaRow:
    now = datetime.now(UTC)
    eid = uuid.UUID(entry_id) if entry_id else uuid.uuid4()
    mid = uuid.UUID(media_id) if media_id else uuid.uuid4()
    path = storage_path or f"{user_id}/{eid}/{mid}.jpg"
    return EntryMediaRow(
        id=mid,
        entry_id=eid,
        user_id=uuid.UUID(user_id),
        storage_path=path,
        file_name=file_name,
        content_type=content_type,
        size_bytes=size_bytes,
        width=width,
        height=height,
        duration_ms=duration_ms,
        waveform=waveform,
        sort_order=sort_order,
        created_at=created_at or now,
    )


def make_space_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    space_id: str | None = None,
    name: str = "My Journal",
    description: str | None = None,
    color: str | None = None,
    icon: str | None = None,
    sort_order: int = 0,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> JournalSpaceRow:
    now = datetime.now(UTC)
    return JournalSpaceRow(
        id=uuid.UUID(space_id) if space_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        name=name,
        description=description,
        color=color,
        icon=icon,
        sort_order=sort_order,
        created_at=created_at or now,
        updated_at=updated_at or now,
        deleted_at=deleted_at,
    )


def make_ai_session_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    session_id: str | None = None,
    parent_session_id: str | None = None,
    session_type: str = "check_in",
    status: str = "active",
    entry_id: str | None = None,
    trigger_source: str | None = "manual",
    model_id: str | None = None,
    flow_state: dict[str, object] | None = None,
    token_count_total: int = 0,
    created_at: datetime | None = None,
    completed_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> AISessionRow:
    now = datetime.now(UTC)
    return AISessionRow(
        id=uuid.UUID(session_id) if session_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        parent_session_id=(
            uuid.UUID(parent_session_id) if parent_session_id else None
        ),
        session_type=session_type,
        status=status,
        entry_id=uuid.UUID(entry_id) if entry_id else None,
        trigger_source=trigger_source,
        model_id=model_id,
        flow_state=flow_state or {},
        token_count_total=token_count_total,
        metadata={},
        created_at=created_at or now,
        completed_at=completed_at,
        deleted_at=deleted_at,
    )


def make_ai_prompt_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    prompt_id: str | None = None,
    prompt_type: str = "check_in",
    content: str = "How are you feeling today?",
    source: str = "curated",
    mood_category: str | None = None,
    session_id: str | None = None,
    entry_id: str | None = None,
    converted_entry_id: str | None = None,
    status: str = "pending",
    context: dict[str, object] | None = None,
    delivered_at: datetime | None = None,
    seen_at: datetime | None = None,
    engaged_at: datetime | None = None,
    dismissed_at: datetime | None = None,
    converted_at: datetime | None = None,
    created_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> AIPromptRow:
    now = datetime.now(UTC)
    return AIPromptRow(
        id=uuid.UUID(prompt_id) if prompt_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        prompt_type=prompt_type,
        content=content,
        context=context or {},
        source=source,
        mood_category=mood_category,
        session_id=uuid.UUID(session_id) if session_id else None,
        entry_id=uuid.UUID(entry_id) if entry_id else None,
        converted_entry_id=(
            uuid.UUID(converted_entry_id) if converted_entry_id else None
        ),
        status=status,
        delivered_at=delivered_at,
        seen_at=seen_at,
        engaged_at=engaged_at,
        dismissed_at=dismissed_at,
        converted_at=converted_at,
        created_at=created_at or now,
        deleted_at=deleted_at,
    )


def make_ai_insight_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    insight_id: str | None = None,
    insight_type: str = "weekly_summary",
    title: str = "Week of Jan 6",
    content: str = "You wrote 5 entries this week.",
    supporting_entry_ids: list[str] | None = None,
    source: str = "computed",
    model_id: str | None = None,
    confidence: float | None = 1.0,
    period_start: object | None = None,
    period_end: object | None = None,
    status: str = "generated",
    session_id: str | None = None,
    superseded_by: str | None = None,
    created_at: datetime | None = None,
    expires_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> AIInsightRow:
    now = datetime.now(UTC)
    return AIInsightRow(
        id=uuid.UUID(insight_id) if insight_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        insight_type=insight_type,
        title=title,
        content=content,
        supporting_entry_ids=[
            uuid.UUID(eid) for eid in (supporting_entry_ids or [])
        ],
        source=source,
        model_id=model_id,
        confidence=confidence,
        period_start=period_start,
        period_end=period_end,
        status=status,
        session_id=uuid.UUID(session_id) if session_id else None,
        superseded_by=uuid.UUID(superseded_by) if superseded_by else None,
        metadata={},
        created_at=created_at or now,
        expires_at=expires_at,
        deleted_at=deleted_at,
    )


def make_ai_profile_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    ai_enabled: bool = True,
    prompt_style: str = "gentle",
    topics_to_avoid: list[str] | None = None,
    goals: list[dict[str, object]] | None = None,
    last_check_in_at: datetime | None = None,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
) -> UserAIProfileRow:
    now = datetime.now(UTC)
    return UserAIProfileRow(
        user_id=uuid.UUID(user_id),
        ai_enabled=ai_enabled,
        prompt_style=prompt_style,
        topics_to_avoid=topics_to_avoid or [],
        goals=goals or [],
        last_check_in_at=last_check_in_at,
        created_at=created_at or now,
        updated_at=updated_at or now,
    )


def make_notification_prefs_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    reminders_enabled: bool = True,
    frequency: str = "daily",
    reminder_times: list[ReminderTime] | None = None,
    active_days: list[int] | None = None,
    quiet_hours_start: dt_time | None = None,
    quiet_hours_end: dt_time | None = None,
    last_notified_at: datetime | None = None,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
) -> NotificationPreferencesRow:
    now = datetime.now(UTC)
    return NotificationPreferencesRow(
        user_id=uuid.UUID(user_id),
        reminders_enabled=reminders_enabled,
        frequency=frequency,
        reminder_times=reminder_times or [ReminderTime(hour=9, minute=0)],
        active_days=active_days or [0, 1, 2, 3, 4, 5, 6],
        quiet_hours_start=quiet_hours_start,
        quiet_hours_end=quiet_hours_end,
        last_notified_at=last_notified_at,
        created_at=created_at or now,
        updated_at=updated_at or now,
    )


def make_ai_message_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    message_id: str | None = None,
    session_id: str | None = None,
    role: str = "assistant",
    content: str = "How are you feeling today?",
    sort_order: int = 0,
    token_count: int | None = None,
    latency_ms: int | None = None,
    model_id: str | None = None,
    created_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> AIMessageRow:
    now = datetime.now(UTC)
    sid = uuid.UUID(session_id) if session_id else uuid.uuid4()
    return AIMessageRow(
        id=uuid.UUID(message_id) if message_id else uuid.uuid4(),
        session_id=sid,
        user_id=uuid.UUID(user_id),
        role=role,
        content=content,
        sort_order=sort_order,
        token_count=token_count,
        latency_ms=latency_ms,
        model_id=model_id,
        metadata={},
        created_at=created_at or now,
        deleted_at=deleted_at,
    )


def make_ai_feedback_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    feedback_id: str | None = None,
    target_type: str = "prompt",
    target_id: str | None = None,
    rating: int = 1,
    reason: str | None = None,
    created_at: datetime | None = None,
) -> AIFeedbackRow:
    now = datetime.now(UTC)
    return AIFeedbackRow(
        id=uuid.UUID(feedback_id) if feedback_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        target_type=target_type,
        target_id=uuid.UUID(target_id) if target_id else uuid.uuid4(),
        rating=rating,
        reason=reason,
        metadata={},
        created_at=created_at or now,
    )


def make_ai_task_row(
    *,
    user_id: str = DEFAULT_USER_ID,
    task_id: str | None = None,
    task_type: str = "generate_insight",
    status: str = "pending",
    priority: int = 0,
    input_data: dict[str, object] | None = None,
    output: dict[str, object] | None = None,
    error: str | None = None,
    session_id: str | None = None,
    attempts: int = 0,
    max_attempts: int = 3,
    scheduled_for: datetime | None = None,
    started_at: datetime | None = None,
    completed_at: datetime | None = None,
    created_at: datetime | None = None,
) -> AIAgentTaskRow:
    now = datetime.now(UTC)
    return AIAgentTaskRow(
        id=uuid.UUID(task_id) if task_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        task_type=task_type,
        status=status,
        priority=priority,
        input=input_data or {},
        output=output,
        error=error,
        session_id=uuid.UUID(session_id) if session_id else None,
        attempts=attempts,
        max_attempts=max_attempts,
        scheduled_for=scheduled_for or now,
        started_at=started_at,
        completed_at=completed_at,
        created_at=created_at or now,
    )
