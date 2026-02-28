import pytest

from nstil.services.token_blacklist import TokenBlacklistService


class FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, tuple[bytes, int]] = {}

    async def setex(self, key: str, ttl: int, value: bytes) -> None:
        self._store[key] = (value, ttl)

    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0


class FakeRedisUnavailable:
    async def setex(self, key: str, ttl: int, value: bytes) -> None:
        raise ConnectionError("Redis unavailable")

    async def exists(self, key: str) -> int:
        raise ConnectionError("Redis unavailable")


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis()


@pytest.fixture
def service(fake_redis: FakeRedis) -> TokenBlacklistService:
    return TokenBlacklistService(fake_redis)  # type: ignore[arg-type]


class TestRevoke:
    async def test_revoke_stores_key(
        self,
        service: TokenBlacklistService,
        fake_redis: FakeRedis,
    ) -> None:
        await service.revoke("session-123", 3600)
        assert "nstil:blacklist:session-123" in fake_redis._store

    async def test_revoke_sets_correct_ttl(
        self,
        service: TokenBlacklistService,
        fake_redis: FakeRedis,
    ) -> None:
        await service.revoke("session-123", 1800)
        _, ttl = fake_redis._store["nstil:blacklist:session-123"]
        assert ttl == 1800

    async def test_revoke_clamps_negative_ttl(
        self,
        service: TokenBlacklistService,
        fake_redis: FakeRedis,
    ) -> None:
        await service.revoke("session-123", -100)
        _, ttl = fake_redis._store["nstil:blacklist:session-123"]
        assert ttl == 1

    async def test_revoke_clamps_zero_ttl(
        self,
        service: TokenBlacklistService,
        fake_redis: FakeRedis,
    ) -> None:
        await service.revoke("session-123", 0)
        _, ttl = fake_redis._store["nstil:blacklist:session-123"]
        assert ttl == 1

    async def test_revoke_fail_open_on_redis_error(self) -> None:
        unavailable = TokenBlacklistService(
            FakeRedisUnavailable(),  # type: ignore[arg-type]
        )
        await unavailable.revoke("session-123", 3600)


class TestIsRevoked:
    async def test_not_revoked_by_default(
        self,
        service: TokenBlacklistService,
    ) -> None:
        result = await service.is_revoked("session-123")
        assert result is False

    async def test_revoked_after_revoke(
        self,
        service: TokenBlacklistService,
    ) -> None:
        await service.revoke("session-123", 3600)
        result = await service.is_revoked("session-123")
        assert result is True

    async def test_different_sessions_independent(
        self,
        service: TokenBlacklistService,
    ) -> None:
        await service.revoke("session-a", 3600)
        assert await service.is_revoked("session-a") is True
        assert await service.is_revoked("session-b") is False

    async def test_fail_open_on_redis_error(self) -> None:
        unavailable = TokenBlacklistService(
            FakeRedisUnavailable(),  # type: ignore[arg-type]
        )
        result = await unavailable.is_revoked("session-123")
        assert result is False


class TestBuildKey:
    def test_key_format(self) -> None:
        key = TokenBlacklistService._build_key("abc-123")
        assert key == "nstil:blacklist:abc-123"
