from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True, slots=True)
class RateLimitTier:
    window_seconds: int
    max_requests: int


IP_TIER: Final[RateLimitTier] = RateLimitTier(window_seconds=60, max_requests=120)
USER_TIER: Final[RateLimitTier] = RateLimitTier(window_seconds=60, max_requests=60)

ROUTE_TIERS: Final[dict[str, RateLimitTier]] = {
    "write": RateLimitTier(window_seconds=60, max_requests=30),
    "search": RateLimitTier(window_seconds=60, max_requests=20),
    "ai": RateLimitTier(window_seconds=60, max_requests=10),
    "media_upload": RateLimitTier(window_seconds=60, max_requests=10),
}

_EXEMPT_PREFIXES: Final[tuple[str, ...]] = (
    "/api/v1/health",
    "/health",
    "/healthz",
    "/ready",
    "/readyz",
    "/metrics",
    "/favicon.ico",
    "/docs",
    "/redoc",
    "/openapi.json",
)

_AI_PREFIXES: Final[tuple[str, ...]] = (
    "/api/v1/check-in/",
    "/api/v1/check-in/start",
    "/api/v1/insights/generate",
    "/api/v1/ai/prompts/generate",
)

_SEARCH_PATHS: Final[frozenset[str]] = frozenset({"/api/v1/entries/search"})

_MEDIA_UPLOAD_PREFIX: Final[str] = "/api/v1/entries/"
_MEDIA_UPLOAD_SUFFIX: Final[str] = "/media"

_WRITE_METHODS: Final[frozenset[str]] = frozenset({"POST", "PATCH", "PUT", "DELETE"})

_WRITE_PREFIXES: Final[tuple[str, ...]] = (
    "/api/v1/entries",
    "/api/v1/journals",
)


def is_exempt(path: str) -> bool:
    return path.startswith(_EXEMPT_PREFIXES)


def classify_route(method: str, path: str) -> str | None:
    if method == "POST" and _is_media_upload(path):
        return "media_upload"

    if path.startswith(_AI_PREFIXES):
        return "ai"

    if method == "GET" and path in _SEARCH_PATHS:
        return "search"

    if method in _WRITE_METHODS and path.startswith(_WRITE_PREFIXES):
        return "write"

    return None


def _is_media_upload(path: str) -> bool:
    if not path.startswith(_MEDIA_UPLOAD_PREFIX):
        return False
    remainder = path[len(_MEDIA_UPLOAD_PREFIX) :]
    return remainder.endswith(_MEDIA_UPLOAD_SUFFIX)
