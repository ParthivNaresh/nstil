import pytest
from pydantic import SecretStr, ValidationError

from nstil.config import Settings


class TestSettingsValidation:
    def test_valid_secrets_accepted(self) -> None:
        settings = Settings(
            supabase_service_key=SecretStr("valid-service-key"),
            supabase_jwt_secret=SecretStr("valid-jwt-secret"),
        )
        assert settings.supabase_service_key.get_secret_value() == "valid-service-key"
        assert settings.supabase_jwt_secret.get_secret_value() == "valid-jwt-secret"

    def test_empty_service_key_rejected(self) -> None:
        with pytest.raises(ValidationError, match="SUPABASE_SERVICE_KEY must not be empty"):
            Settings(
                supabase_service_key=SecretStr(""),
                supabase_jwt_secret=SecretStr("valid-jwt-secret"),
            )

    def test_empty_jwt_secret_rejected(self) -> None:
        with pytest.raises(ValidationError, match="SUPABASE_JWT_SECRET must not be empty"):
            Settings(
                supabase_service_key=SecretStr("valid-service-key"),
                supabase_jwt_secret=SecretStr(""),
            )

    def test_both_empty_secrets_rejected(self) -> None:
        with pytest.raises(ValidationError):
            Settings(
                supabase_service_key=SecretStr(""),
                supabase_jwt_secret=SecretStr(""),
            )

    def test_valid_settings_constructable(self) -> None:
        settings = Settings(
            supabase_service_key=SecretStr("key"),
            supabase_jwt_secret=SecretStr("secret"),
        )
        assert isinstance(settings.supabase_url, str)
        assert isinstance(settings.redis_url, str)
        assert isinstance(settings.cors_origins, list)
        assert isinstance(settings.debug, bool)
        assert isinstance(settings.log_level, str)
        assert isinstance(settings.log_format, str)
