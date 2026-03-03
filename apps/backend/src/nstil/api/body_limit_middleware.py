import json
from typing import Final

from starlette.types import ASGIApp, Message, Receive, Scope, Send

_413_BODY: Final[bytes] = json.dumps(
    {"detail": "Request body too large"},
).encode()

_413_HEADERS: Final[list[tuple[bytes, bytes]]] = [
    (b"content-type", b"application/json"),
    (b"connection", b"close"),
]

_METHODS_WITHOUT_BODY: Final[frozenset[str]] = frozenset(
    {"GET", "HEAD", "OPTIONS", "DELETE", "TRACE"},
)


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, *, max_body_bytes: int) -> None:
        self._app = app
        self._max_body_bytes = max_body_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        method: str = scope.get("method", "GET")
        if method in _METHODS_WITHOUT_BODY:
            await self._app(scope, receive, send)
            return

        if self._content_length_exceeds_limit(scope):
            await _drain_request(receive)
            await _send_413(send)
            return

        bytes_received = 0
        limit_exceeded = False
        response_started = False

        async def guarded_receive() -> Message:
            nonlocal bytes_received, limit_exceeded

            message = await receive()

            if message["type"] == "http.request":
                body: bytes = message.get("body", b"")
                bytes_received += len(body)
                if bytes_received > self._max_body_bytes:
                    limit_exceeded = True
                    message = {"type": "http.request", "body": b"", "more_body": False}

            return message

        async def tracking_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        await self._app(scope, guarded_receive, tracking_send)

        if limit_exceeded and not response_started:
            await _send_413(send)

    def _content_length_exceeds_limit(self, scope: Scope) -> bool:
        raw_headers: list[tuple[bytes, bytes]] = scope.get("headers", [])
        for name, value in raw_headers:
            if name == b"content-length":
                try:
                    return int(value) > self._max_body_bytes
                except (ValueError, OverflowError):
                    return False
        return False


async def _drain_request(receive: Receive) -> None:
    while True:
        message = await receive()
        if message["type"] == "http.request":
            if not message.get("more_body", False):
                return
        elif message["type"] == "http.disconnect":
            return


async def _send_413(send: Send) -> None:
    await send(
        {
            "type": "http.response.start",
            "status": 413,
            "headers": _413_HEADERS,
        }
    )
    await send(
        {
            "type": "http.response.body",
            "body": _413_BODY,
        }
    )
