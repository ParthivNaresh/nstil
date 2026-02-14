import hashlib
from uuid import UUID

from nstil.services.cache.constants import KEY_PREFIX


def entry_key(user_id: UUID, entry_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:entry:{entry_id}"


def entry_list_key(
    user_id: UUID,
    cursor: str | None,
    limit: int,
    journal_id: str | None = None,
) -> str:
    raw = f"{cursor or ''}:{limit}:{journal_id or ''}"
    cursor_hash = hashlib.md5(raw.encode(), usedforsecurity=False).hexdigest()[:12]
    return f"{KEY_PREFIX}:user:{user_id}:entries:list:{cursor_hash}"


def entry_list_pattern(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:entries:list:*"


def search_key(
    user_id: UUID,
    query: str,
    cursor: str | None,
    limit: int,
    journal_id: str | None = None,
) -> str:
    raw = f"{query}:{cursor or ''}:{limit}:{journal_id or ''}"
    query_hash = hashlib.md5(raw.encode(), usedforsecurity=False).hexdigest()[:12]
    return f"{KEY_PREFIX}:user:{user_id}:entries:search:{query_hash}"


def search_pattern(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:entries:search:*"
