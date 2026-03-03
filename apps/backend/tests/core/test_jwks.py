import asyncio
import base64
from unittest.mock import AsyncMock, MagicMock, patch

from cryptography.hazmat.primitives.asymmetric import ec
from jwt import PyJWK

from nstil.core.jwks import _RELOAD_COOLDOWN_SECONDS, JWKSKeyStore


def _make_ec_jwk(kid: str) -> dict[str, object]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    numbers = public_key.public_numbers()
    x_bytes = numbers.x.to_bytes(32, byteorder="big")
    y_bytes = numbers.y.to_bytes(32, byteorder="big")

    return {
        "kty": "EC",
        "crv": "P-256",
        "kid": kid,
        "x": base64.urlsafe_b64encode(x_bytes).rstrip(b"=").decode(),
        "y": base64.urlsafe_b64encode(y_bytes).rstrip(b"=").decode(),
        "alg": "ES256",
        "use": "sig",
    }


def _make_jwks_response(*kids: str) -> dict[str, list[dict[str, object]]]:
    return {"keys": [_make_ec_jwk(kid) for kid in kids]}


def _mock_httpx_get(jwks_data: dict[str, list[dict[str, object]]]) -> AsyncMock:
    mock_response = MagicMock()
    mock_response.json.return_value = jwks_data
    mock_response.raise_for_status.return_value = None

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    return mock_client


class TestJWKSKeyStoreLoad:
    async def test_load_populates_keys(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1", "key-2")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        assert store.get_key("key-1") is not None
        assert store.get_key("key-2") is not None
        assert isinstance(store.get_key("key-1"), PyJWK)

    async def test_load_clears_old_keys(self) -> None:
        store = JWKSKeyStore()

        jwks_v1 = _make_jwks_response("old-key")
        mock_v1 = _mock_httpx_get(jwks_v1)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v1):
            await store.load("http://localhost:54321")
        assert store.get_key("old-key") is not None

        jwks_v2 = _make_jwks_response("new-key")
        mock_v2 = _mock_httpx_get(jwks_v2)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v2):
            await store.load("http://localhost:54321")
        assert store.get_key("old-key") is None
        assert store.get_key("new-key") is not None

    async def test_get_key_unknown_kid_returns_none(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("known-key")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        assert store.get_key("unknown-key") is None

    async def test_is_loaded_false_initially(self) -> None:
        store = JWKSKeyStore()
        assert store.is_loaded is False

    async def test_is_loaded_true_after_load(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        assert store.is_loaded is True

    async def test_load_stores_supabase_url(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://my-supabase:54321")

        assert store._supabase_url == "http://my-supabase:54321"

    async def test_load_skips_keys_without_kid(self) -> None:
        store = JWKSKeyStore()
        key_data = _make_ec_jwk("valid-kid")
        no_kid_data = _make_ec_jwk("")
        jwks_data: dict[str, list[dict[str, object]]] = {
            "keys": [key_data, no_kid_data],
        }
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        assert store.get_key("valid-kid") is not None
        assert store.get_key("") is None


class TestGetKeyOrReload:
    async def test_returns_cached_key_without_reload(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("cached-key")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        key = await store.get_key_or_reload("cached-key")
        assert key is not None
        mock_client.get.assert_called_once()

    async def test_reload_fetches_new_key(self) -> None:
        store = JWKSKeyStore()

        jwks_v1 = _make_jwks_response("key-a")
        mock_v1 = _mock_httpx_get(jwks_v1)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v1):
            await store.load("http://localhost:54321")

        store._last_reload_at = 0.0

        jwks_v2 = _make_jwks_response("key-a", "key-b")
        mock_v2 = _mock_httpx_get(jwks_v2)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v2):
            key = await store.get_key_or_reload("key-b")

        assert key is not None

    async def test_returns_none_when_no_supabase_url(self) -> None:
        store = JWKSKeyStore()
        result = await store.get_key_or_reload("any-kid")
        assert result is None

    async def test_respects_cooldown(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-a")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        mock_reload = _mock_httpx_get(_make_jwks_response("key-a", "key-b"))
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_reload):
            result = await store.get_key_or_reload("key-b")

        assert result is None
        mock_reload.get.assert_not_called()

    async def test_concurrent_requests_single_fetch(self) -> None:
        store = JWKSKeyStore()
        jwks_v1 = _make_jwks_response("key-a")
        mock_v1 = _mock_httpx_get(jwks_v1)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v1):
            await store.load("http://localhost:54321")

        store._last_reload_at = 0.0

        call_count = 0
        original_load = store.load

        async def counting_load(url: str) -> None:
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.05)
            jwks_v2 = _make_jwks_response("key-a", "key-b")
            mock_v2 = _mock_httpx_get(jwks_v2)
            with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_v2):
                await original_load(url)

        with patch.object(store, "load", side_effect=counting_load):
            results = await asyncio.gather(
                store.get_key_or_reload("key-b"),
                store.get_key_or_reload("key-b"),
                store.get_key_or_reload("key-b"),
            )

        assert call_count == 1
        found = [r for r in results if r is not None]
        assert len(found) >= 1

    async def test_reload_failure_returns_none(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-a")
        mock_client = _mock_httpx_get(jwks_data)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        store._last_reload_at = 0.0

        mock_fail = AsyncMock()
        mock_fail.get.side_effect = Exception("network error")
        mock_fail.__aenter__ = AsyncMock(return_value=mock_fail)
        mock_fail.__aexit__ = AsyncMock(return_value=None)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_fail):
            result = await store.get_key_or_reload("key-b")

        assert result is None
        assert store.get_key("key-a") is not None

    async def test_reload_failure_preserves_existing_keys(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-a")
        mock_client = _mock_httpx_get(jwks_data)
        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        original_key = store.get_key("key-a")
        store._last_reload_at = 0.0

        mock_fail = AsyncMock()
        mock_fail.get.side_effect = Exception("network error")
        mock_fail.__aenter__ = AsyncMock(return_value=mock_fail)
        mock_fail.__aexit__ = AsyncMock(return_value=None)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_fail):
            await store.get_key_or_reload("key-b")

        assert store.get_key("key-a") is original_key


class TestBackgroundRefresh:
    async def test_calls_load_periodically(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        load_count = 0

        async def mock_load(url: str) -> None:
            nonlocal load_count
            load_count += 1

        with patch.object(store, "load", side_effect=mock_load):
            store.start_background_refresh(interval_seconds=0)
            await asyncio.sleep(0.15)
            await store.stop_background_refresh()

        assert load_count >= 2

    async def test_survives_load_failure(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        call_count = 0

        async def failing_then_ok(url: str) -> None:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("transient failure")

        with patch.object(store, "load", side_effect=failing_then_ok):
            store.start_background_refresh(interval_seconds=0)
            await asyncio.sleep(0.15)
            await store.stop_background_refresh()

        assert call_count >= 2

    async def test_stop_cancels_task(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        store.start_background_refresh(interval_seconds=60)
        assert store._refresh_task is not None
        assert not store._refresh_task.done()

        await store.stop_background_refresh()
        assert store._refresh_task is None

    async def test_start_is_idempotent(self) -> None:
        store = JWKSKeyStore()
        jwks_data = _make_jwks_response("key-1")
        mock_client = _mock_httpx_get(jwks_data)

        with patch("nstil.core.jwks.httpx.AsyncClient", return_value=mock_client):
            await store.load("http://localhost:54321")

        store.start_background_refresh(interval_seconds=60)
        first_task = store._refresh_task
        store.start_background_refresh(interval_seconds=60)
        assert store._refresh_task is first_task

        await store.stop_background_refresh()

    async def test_stop_is_safe_when_not_started(self) -> None:
        store = JWKSKeyStore()
        await store.stop_background_refresh()


class TestCooldownConstant:
    def test_cooldown_is_positive(self) -> None:
        assert _RELOAD_COOLDOWN_SECONDS > 0
