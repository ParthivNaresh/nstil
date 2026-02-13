import re
from typing import Final

SENSITIVE_KEYS: Final[frozenset[str]] = frozenset(
    {
        "access_token",
        "api_key",
        "apikey",
        "authorization",
        "client_secret",
        "encrypted_access_token",
        "encryption_key",
        "jwt_secret",
        "password",
        "private_key",
        "refresh_token",
        "secret",
        "secret_key",
        "service_key",
        "service_role_key",
        "supabase_jwt_secret",
        "supabase_service_key",
        "token",
    }
)

SENSITIVE_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}"),
    re.compile(r"sb_publishable_[A-Za-z0-9_-]{20,}"),
)

MASKED_VALUE: Final[str] = "[REDACTED]"

THIRD_PARTY_LOGGERS: Final[tuple[str, ...]] = (
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "httpx",
    "httpcore",
    "supabase",
    "gotrue",
    "postgrest",
    "realtime",
    "storage3",
    "hiredis",
)
