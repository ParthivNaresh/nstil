import pytest

from nstil.services.rate_limit import RateLimitService
from nstil.services.rate_limit_config import RateLimitTier


class FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, list[tuple[float, str]]] = {}
        self._scripts: list[str] = []

    def register_script(self, script: str) -> "FakeScript":
        self._scripts.append(script)
        return FakeScript(self, script)


class FakeScript:
    def __init__(self, redis: FakeRedis, script: str) -> None:
        self._redis = redis
        self._script = script

    async def __call__(
        self,
        keys: list[str],
        args: list[object],
    ) -> list[int]:
        key = keys[0]
        now = int(args[0])
        window = int(args[1])
        limit = int(args[2])
        member = str(args[3])

        if key not in self._redis._store:
            self._redis._store[key] = []

        entries = self._redis._store[key]
        entries[:] = [(score, m) for score, m in entries if score > now - window]

        current_count = len(entries)

        if current_count >= limit:
            retry_after = 0
            if entries:
                oldest_score = entries[0][0]
                retry_after = max(1, int((oldest_score + window - now) / 1000) + 1)
            return [0, current_count, retry_after]

        entries.append((float(now), member))
        return [1, current_count + 1, 0]


class FakeRedisUnavailable:
    def register_script(self, script: str) -> "FakeScriptUnavailable":
        return FakeScriptUnavailable()


class FakeScriptUnavailable:
    async def __call__(self, keys: list[str], args: list[object]) -> list[int]:
        raise ConnectionError("Redis unavailable")


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis()


@pytest.fixture
def service(fake_redis: FakeRedis) -> RateLimitService:
    return RateLimitService(fake_redis)  # type: ignore[arg-type]


TIER = RateLimitTier(window_seconds=60, max_requests=5)


class TestRateLimitService:
    async def test_allowed_under_limit(self, service: RateLimitService) -> None:
        result = await service.check("test:key", TIER)
        assert result.allowed is True
        assert result.remaining == 4
        assert result.limit == 5
        assert result.retry_after == 0

    async def test_blocked_at_limit(self, service: RateLimitService) -> None:
        for _ in range(5):
            result = await service.check("test:key", TIER)
            assert result.allowed is True

        result = await service.check("test:key", TIER)
        assert result.allowed is False
        assert result.remaining == 0
        assert result.retry_after > 0

    async def test_remaining_decrements(self, service: RateLimitService) -> None:
        for i in range(5):
            result = await service.check("test:key", TIER)
            assert result.remaining == 5 - (i + 1)

    async def test_different_keys_independent(self, service: RateLimitService) -> None:
        for _ in range(5):
            await service.check("key:a", TIER)

        result_a = await service.check("key:a", TIER)
        assert result_a.allowed is False

        result_b = await service.check("key:b", TIER)
        assert result_b.allowed is True

    async def test_fail_open_on_redis_error(self) -> None:
        unavailable_service = RateLimitService(FakeRedisUnavailable())  # type: ignore[arg-type]
        result = await unavailable_service.check("test:key", TIER)
        assert result.allowed is True
        assert result.remaining == TIER.max_requests

    async def test_reset_at_is_future(self, service: RateLimitService) -> None:
        import time

        now = int(time.time())
        result = await service.check("test:key", TIER)
        assert result.reset_at >= now
        assert result.reset_at <= now + TIER.window_seconds + 1


class TestKeyBuilders:
    def test_ip_key(self) -> None:
        key = RateLimitService.build_ip_key("192.168.1.1")
        assert key == "nstil:rl:ip:192.168.1.1"

    def test_user_key(self) -> None:
        key = RateLimitService.build_user_key("user-123")
        assert key == "nstil:rl:user:user-123"

    def test_route_key(self) -> None:
        key = RateLimitService.build_route_key("user-123", "ai")
        assert key == "nstil:rl:user:user-123:ai"
