import time
import uuid

from jose import jwt  # type: ignore[import-untyped]

DEFAULT_SECRET = "test-secret"
DEFAULT_ALGORITHM = "HS256"


def build_jwt_claims(**overrides: object) -> dict[str, object]:
    defaults: dict[str, object] = {
        "sub": str(uuid.uuid4()),
        "email": "test@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "iss": "http://localhost:54321/auth/v1",
    }
    defaults.update(overrides)
    return defaults


def make_token(
    *,
    secret: str = DEFAULT_SECRET,
    algorithm: str = DEFAULT_ALGORITHM,
    **overrides: object,
) -> str:
    claims = build_jwt_claims(**overrides)
    token: str = jwt.encode(claims, secret, algorithm=algorithm)
    return token
