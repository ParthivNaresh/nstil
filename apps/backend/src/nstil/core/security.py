from jose import ExpiredSignatureError, JWTError, jwt  # type: ignore[import-untyped]
from pydantic import ValidationError

from nstil.config import Settings
from nstil.core.exceptions import InvalidTokenError, TokenExpiredError
from nstil.models import UserPayload


def verify_jwt(token: str, settings: Settings) -> UserPayload:
    try:
        payload: dict[str, object] = jwt.decode(
            token,
            settings.supabase_jwt_secret.get_secret_value(),
            algorithms=["HS256"],
            audience="authenticated",
            options={
                "require_sub": True,
                "require_exp": True,
                "require_aud": True,
                "leeway": 30,
            },
        )
    except ExpiredSignatureError as exc:
        raise TokenExpiredError("Token has expired") from exc
    except JWTError as exc:
        raise InvalidTokenError("Invalid token") from exc

    try:
        return UserPayload.model_validate(payload)
    except ValidationError as exc:
        raise InvalidTokenError("Token payload missing required fields") from exc
