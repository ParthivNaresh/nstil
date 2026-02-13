import pytest

from nstil.config import Settings
from nstil.core.exceptions import InvalidTokenError, TokenExpiredError
from nstil.core.security import verify_jwt
from tests.factories import build_jwt_claims, make_token


class TestVerifyJwt:
    def test_valid_token(self, settings: Settings) -> None:
        token = make_token()
        payload = verify_jwt(token, settings)
        assert payload.role == "authenticated"
        assert payload.aud == "authenticated"
        assert payload.email == "test@example.com"

    def test_expired_token(self, settings: Settings) -> None:
        token = make_token(exp=0)
        with pytest.raises(TokenExpiredError):
            verify_jwt(token, settings)

    def test_malformed_token(self, settings: Settings) -> None:
        with pytest.raises(InvalidTokenError):
            verify_jwt("not-a-jwt", settings)

    def test_empty_string(self, settings: Settings) -> None:
        with pytest.raises(InvalidTokenError):
            verify_jwt("", settings)

    def test_missing_sub_claim(self, settings: Settings) -> None:
        claims = build_jwt_claims()
        del claims["sub"]
        from jose import jwt  # type: ignore[import-untyped]

        token: str = jwt.encode(claims, "test-secret", algorithm="HS256")
        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)

    def test_missing_exp_claim(self, settings: Settings) -> None:
        # jose auto-adds exp on encode, so build a token without it
        # by encoding with exp then stripping it won't work — instead
        # we encode claims that include exp, but set require_exp to
        # catch it. Actually, jose's encode always adds exp. We need
        # to craft a raw JWT without exp.
        import base64
        import hashlib
        import hmac
        import json

        header = base64.urlsafe_b64encode(
            json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
        ).rstrip(b"=")
        claims = build_jwt_claims()
        del claims["exp"]
        payload_b = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=")
        signing_input = header + b"." + payload_b
        sig = base64.urlsafe_b64encode(
            hmac.new(b"test-secret", signing_input, hashlib.sha256).digest()
        ).rstrip(b"=")
        token = (signing_input + b"." + sig).decode()

        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)

    def test_wrong_audience(self, settings: Settings) -> None:
        token = make_token(aud="wrong-audience")
        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)

    def test_wrong_algorithm(self, settings: Settings) -> None:
        token = make_token(algorithm="HS384")
        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)

    def test_wrong_secret(self, settings: Settings) -> None:
        token = make_token(secret="wrong-secret")
        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)

    def test_missing_role_claim(self, settings: Settings) -> None:
        claims = build_jwt_claims()
        del claims["role"]
        from jose import jwt  # type: ignore[import-untyped]

        token: str = jwt.encode(claims, "test-secret", algorithm="HS256")
        with pytest.raises(InvalidTokenError):
            verify_jwt(token, settings)
