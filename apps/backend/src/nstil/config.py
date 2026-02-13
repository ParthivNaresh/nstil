from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = "http://localhost:54321"
    supabase_service_key: SecretStr = SecretStr("")
    supabase_jwt_secret: SecretStr = SecretStr("")
    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:8081"]
    debug: bool = False
    log_level: str = "INFO"
    log_format: str = "console"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @model_validator(mode="after")
    def _check_secrets(self) -> "Settings":
        if not self.supabase_service_key.get_secret_value():
            raise ValueError("SUPABASE_SERVICE_KEY must not be empty")
        if not self.supabase_jwt_secret.get_secret_value():
            raise ValueError("SUPABASE_JWT_SECRET must not be empty")
        return self
