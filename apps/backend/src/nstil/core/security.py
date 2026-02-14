import structlog
from jose import ExpiredSignatureError, JWTError, jwt  # type: ignore[import-untyped]
from pydantic import ValidationError

from nstil.config import Settings
from nstil.core.exceptions import InvalidTokenError, TokenExpiredError
from nstil.core.jwks import jwks_store
from nstil.models import UserPayload

logger = structlog.get_logger(__name__)

_DECODE_OPTIONS: dict[str, object] = {
    "require_sub": True,
    "require_exp": True,
    "require_aud": True,
    "leeway": 30,
}

_AUDIENCE = "authenticated"


def _get_unverified_header(token: str) -> dict[str, str]:
    header: dict[str, str] = jwt.get_unverified_header(token)
    return header


def _decode_with_jwks(token: str) -> dict[str, object] | None:
    if not jwks_store.is_loaded:
        return None

    header = _get_unverified_header(token)
    kid = header.get("kid")
    alg = header.get("alg", "")

    if not kid or alg not in ("ES256", "ES384", "ES512"):
        return None

    key = jwks_store.get_key(kid)
    if key is None:
        return None

    payload: dict[str, object] = jwt.decode(
        token,
        key,
        algorithms=[alg],
        audience=_AUDIENCE,
        options=_DECODE_OPTIONS,
    )
    return payload


def _decode_with_secret(token: str, settings: Settings) -> dict[str, object]:
    payload: dict[str, object] = jwt.decode(
        token,
        settings.supabase_jwt_secret.get_secret_value(),
        algorithms=["HS256"],
        audience=_AUDIENCE,
        options=_DECODE_OPTIONS,
    )
    return payload


def verify_jwt(token: str, settings: Settings) -> UserPayload:
    try:
        header = _get_unverified_header(token)
    except JWTError as exc:
        logger.warning("jwt.malformed_header", error=str(exc))
        raise InvalidTokenError("Invalid token") from exc

    try:
        payload = _decode_with_jwks(token)
        if payload is None:
            payload = _decode_with_secret(token, settings)
    except ExpiredSignatureError as exc:
        logger.info("jwt.expired", alg=header.get("alg"), kid=header.get("kid"))
        raise TokenExpiredError("Token has expired") from exc
    except JWTError as exc:
        logger.warning(
            "jwt.verification_failed",
            reason=str(exc),
            alg=header.get("alg"),
            kid=header.get("kid"),
            jwks_loaded=jwks_store.is_loaded,
        )
        raise InvalidTokenError("Invalid token") from exc

    try:
        return UserPayload.model_validate(payload)
    except ValidationError as exc:
        logger.warning("jwt.invalid_payload", errors=exc.error_count())
        raise InvalidTokenError("Token payload missing required fields") from exc
