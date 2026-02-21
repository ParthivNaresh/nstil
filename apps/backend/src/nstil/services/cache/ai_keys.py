from uuid import UUID

from nstil.services.cache.constants import KEY_PREFIX


def ai_context_key(user_id: UUID, entry_limit: int, days_back: int) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:ai:context:{entry_limit}:{days_back}"


def ai_context_pattern(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:ai:context:*"


def ai_profile_key(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:ai:profile"


def notification_prefs_key(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:notification:prefs"


def user_profile_key(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:profile"
