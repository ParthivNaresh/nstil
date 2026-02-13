from typing import Final

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

_PUBLIC_PATH_PREFIXES: Final[tuple[str, ...]] = (
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

_NO_STORE_HEADERS: Final[dict[str, str]] = {
    "Cache-Control": "no-store, private",
    "Pragma": "no-cache",
}


class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        response = await call_next(request)

        if not self._is_public_path(request.url.path):
            for header, value in _NO_STORE_HEADERS.items():
                response.headers[header] = value

        return response

    def _is_public_path(self, path: str) -> bool:
        return path.startswith(_PUBLIC_PATH_PREFIXES)
