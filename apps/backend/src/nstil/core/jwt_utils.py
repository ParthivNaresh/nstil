import base64
import json


def extract_sub(token: str) -> str | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    try:
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload: dict[str, object] = json.loads(payload_bytes)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        return None

    return sub
