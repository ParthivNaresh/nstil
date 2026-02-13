import pytest
from pydantic import SecretStr

from nstil.config import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings(
        supabase_url="http://localhost:54321",
        supabase_service_key=SecretStr("test-service-key"),
        supabase_jwt_secret=SecretStr("test-secret"),
        redis_url="redis://localhost:6379",
        debug=True,
    )
