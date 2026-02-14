import time
import uuid
from datetime import UTC, datetime

from jose import jwt  # type: ignore[import-untyped]

from nstil.models.journal import JournalEntryRow
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
    mood_score: int | None = 3,
    tags: list[str] | None = None,
    location: str | None = None,
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
        mood_score=mood_score,
        tags=tags or [],
        location=location,
        entry_type=entry_type,
        is_pinned=is_pinned,
        metadata={},
        created_at=created_at or now,
        updated_at=updated_at or now,
        deleted_at=deleted_at,
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
