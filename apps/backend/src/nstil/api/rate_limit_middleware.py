import json
from typing import Final

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from nstil.core.app_state import AppState
from nstil.core.jwt_utils import extract_sub
from nstil.services.rate_limit import RateLimitResult, RateLimitService
from nstil.services.rate_limit_config import (
    IP_TIER,
    ROUTE_TIERS,
    USER_TIER,
    classify_route,
    is_exempt,
)

_BEARER_PREFIX: Final[str] = "bearer "
_BEARER_PREFIX_LEN: Final[int] = len(_BEARER_PREFIX)

_429_BODY: Final[bytes] = json.dumps({"detail": "Rate limit exceeded"}).encode()

_RATE_LIMIT_HEADERS: Final[list[tuple[bytes, bytes]]] = [
    (b"content-type", b"application/json"),
]


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, *, enabled: bool = True) -> None:
        self._app = app
        self._enabled = enabled

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not self._enabled:
            await self._app(scope, receive, send)
            return

        path: str = scope.get("path", "")
        if is_exempt(path):
            await self._app(scope, receive, send)
            return

        service = self._get_rate_limiter(scope)
        if service is None:
            await self._app(scope, receive, send)
            return

        header_map = _build_header_map(scope)
        method: str = scope.get("method", "GET")
        client_ip = _extract_client_ip(scope, header_map)

        ip_result = await service.check(
            RateLimitService.build_ip_key(client_ip),
            IP_TIER,
        )
        if not ip_result.allowed:
            await self._send_429(send, ip_result)
            return

        user_id = _extract_user_id(header_map)
        most_specific_result = ip_result

        if user_id is not None:
            user_result = await service.check(
                RateLimitService.build_user_key(user_id),
                USER_TIER,
            )
            most_specific_result = user_result
            if not user_result.allowed:
                await self._send_429(send, user_result)
                return

            route_group = classify_route(method, path)
            if route_group is not None:
                tier = ROUTE_TIERS.get(route_group)
                if tier is not None:
                    route_result = await service.check(
                        RateLimitService.build_route_key(user_id, route_group),
                        tier,
                    )
                    most_specific_result = route_result
                    if not route_result.allowed:
                        await self._send_429(send, route_result)
                        return

        final_result = most_specific_result

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers: list[tuple[bytes, bytes]] = list(message.get("headers", []))
                headers.extend(_build_rate_limit_headers(final_result))
                message["headers"] = headers
            await send(message)

        await self._app(scope, receive, send_with_headers)

    @staticmethod
    def _get_rate_limiter(scope: Scope) -> RateLimitService | None:
        app = scope.get("app")
        if app is None:
            return None
        state = getattr(app, "state", None)
        if state is None:
            return None
        app_state: AppState | None = getattr(state, "app", None)
        if app_state is None:
            return None
        return app_state.rate_limiter

    @staticmethod
    async def _send_429(send: Send, result: RateLimitResult) -> None:
        headers = list(_RATE_LIMIT_HEADERS)
        headers.extend(_build_rate_limit_headers(result))
        if result.retry_after > 0:
            headers.append((b"retry-after", str(result.retry_after).encode()))

        await send(
            {
                "type": "http.response.start",
                "status": 429,
                "headers": headers,
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": _429_BODY,
            }
        )


def _build_header_map(scope: Scope) -> dict[bytes, bytes]:
    raw_headers: list[tuple[bytes, bytes]] = scope.get("headers", [])
    return {k: v for k, v in raw_headers}


def _extract_client_ip(
    scope: Scope,
    header_map: dict[bytes, bytes],
) -> str:
    forwarded = header_map.get(b"x-forwarded-for")
    if forwarded is not None:
        decoded: str = forwarded.decode("latin-1")
        return decoded.split(",")[0].strip()

    raw_client: object = scope.get("client")
    if raw_client is not None and isinstance(raw_client, (list, tuple)):
        return str(raw_client[0])

    return "unknown"


def _extract_user_id(header_map: dict[bytes, bytes]) -> str | None:
    auth_header = header_map.get(b"authorization")
    if auth_header is None:
        return None

    auth_value: str = auth_header.decode("latin-1")
    if not auth_value.lower().startswith(_BEARER_PREFIX):
        return None

    token = auth_value[_BEARER_PREFIX_LEN:]
    return extract_sub(token)


def _build_rate_limit_headers(result: RateLimitResult) -> list[tuple[bytes, bytes]]:
    return [
        (b"x-ratelimit-limit", str(result.limit).encode()),
        (b"x-ratelimit-remaining", str(result.remaining).encode()),
        (b"x-ratelimit-reset", str(result.reset_at).encode()),
    ]
