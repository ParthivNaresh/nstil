from uuid import UUID

from nstil.services.cache.constants import KEY_PREFIX


def space_key(user_id: UUID, space_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:space:{space_id}"


def space_list_key(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:spaces:list"


def space_list_pattern(user_id: UUID) -> str:
    return f"{KEY_PREFIX}:user:{user_id}:spaces:*"
