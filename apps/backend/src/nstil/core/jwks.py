from __future__ import annotations

import httpx
import structlog
from jose import jwk  # type: ignore[import-untyped]
from jose.backends.base import Key  # type: ignore[import-untyped]

logger = structlog.get_logger(__name__)


class JWKSKeyStore:
    _keys: dict[str, Key]

    def __init__(self) -> None:
        self._keys = {}

    async def load(self, supabase_url: str) -> None:
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks_data: dict[str, list[dict[str, object]]] = response.json()

        self._keys = {}
        for key_data in jwks_data.get("keys", []):
            kid = str(key_data.get("kid", ""))
            alg = str(key_data.get("alg", ""))
            if kid and alg:
                self._keys[kid] = jwk.construct(key_data, algorithm=alg)

        logger.info("jwks.loaded", key_count=len(self._keys))

    def get_key(self, kid: str) -> Key | None:
        return self._keys.get(kid)

    @property
    def is_loaded(self) -> bool:
        return len(self._keys) > 0


jwks_store = JWKSKeyStore()
