import base64
import json
import time

import jwt

from nstil.core.jwt_utils import extract_sub


def _encode_payload(payload: dict[str, object]) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).rstrip(b"=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    sig = base64.urlsafe_b64encode(b"fakesig").rstrip(b"=")
    return f"{header.decode()}.{body.decode()}.{sig.decode()}"


class TestExtractSub:
    def test_valid_token(self) -> None:
        token = _encode_payload({"sub": "user-123", "exp": int(time.time()) + 3600})
        assert extract_sub(token) == "user-123"

    def test_valid_real_jwt(self) -> None:
        claims = {
            "sub": "00000000-0000-0000-0000-000000000001",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        }
        token: str = jwt.encode(claims, "secret", algorithm="HS256")
        assert extract_sub(token) == "00000000-0000-0000-0000-000000000001"

    def test_expired_token_still_returns_sub(self) -> None:
        token = _encode_payload({"sub": "user-expired", "exp": int(time.time()) - 3600})
        assert extract_sub(token) == "user-expired"

    def test_missing_sub(self) -> None:
        token = _encode_payload({"email": "test@example.com"})
        assert extract_sub(token) is None

    def test_empty_sub(self) -> None:
        token = _encode_payload({"sub": ""})
        assert extract_sub(token) is None

    def test_non_string_sub(self) -> None:
        token = _encode_payload({"sub": 12345})
        assert extract_sub(token) is None

    def test_malformed_token_no_dots(self) -> None:
        assert extract_sub("notavalidtoken") is None

    def test_malformed_token_two_parts(self) -> None:
        assert extract_sub("header.payload") is None

    def test_malformed_token_four_parts(self) -> None:
        assert extract_sub("a.b.c.d") is None

    def test_invalid_base64_payload(self) -> None:
        assert extract_sub("header.!!!invalid!!!.signature") is None

    def test_invalid_json_payload(self) -> None:
        bad_payload = base64.urlsafe_b64encode(b"not json").rstrip(b"=")
        assert extract_sub(f"header.{bad_payload.decode()}.signature") is None

    def test_empty_string(self) -> None:
        assert extract_sub("") is None
