import time
import uuid
from datetime import UTC, datetime

from jose import jwt  # type: ignore[import-untyped]

from nstil.models.journal import JournalEntryRow

DEFAULT_SECRET = "test-secret"
DEFAULT_ALGORITHM = "HS256"
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


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
    entry_id: str | None = None,
    title: str = "Test Entry",
    body: str = "This is a test journal entry.",
    mood_score: int | None = 3,
    tags: list[str] | None = None,
    location: str | None = None,
    entry_type: str = "journal",
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
    deleted_at: datetime | None = None,
) -> JournalEntryRow:
    now = datetime.now(UTC)
    return JournalEntryRow(
        id=uuid.UUID(entry_id) if entry_id else uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        title=title,
        body=body,
        mood_score=mood_score,
        tags=tags or [],
        location=location,
        entry_type=entry_type,
        metadata={},
        created_at=created_at or now,
        updated_at=updated_at or now,
        deleted_at=deleted_at,
    )
