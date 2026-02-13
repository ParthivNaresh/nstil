import pytest

from nstil.observability.constants import MASKED_VALUE
from nstil.observability.processors import scrub_sensitive_data


def _scrub(event_dict: dict[str, object]) -> dict[str, object]:
    return scrub_sensitive_data(None, "", event_dict)  # type: ignore[arg-type]


class TestScrubSensitiveData:
    def test_sensitive_key_masked(self) -> None:
        result = _scrub({"password": "hunter2", "event": "login"})
        assert result["password"] == MASKED_VALUE
        assert result["event"] == "login"

    @pytest.mark.parametrize(
        "key",
        [
            "access_token",
            "api_key",
            "authorization",
            "jwt_secret",
            "refresh_token",
            "secret_key",
            "supabase_service_key",
        ],
    )
    def test_all_sensitive_keys_masked(self, key: str) -> None:
        result = _scrub({key: "some-value"})
        assert result[key] == MASKED_VALUE

    def test_case_insensitive_key_matching(self) -> None:
        result = _scrub({"Password": "hunter2", "ACCESS_TOKEN": "abc"})
        assert result["Password"] == MASKED_VALUE
        assert result["ACCESS_TOKEN"] == MASKED_VALUE

    def test_jwt_pattern_masked(self) -> None:
        jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
        result = _scrub({"message": jwt})
        assert result["message"] == MASKED_VALUE

    def test_supabase_secret_key_pattern_masked(self) -> None:
        key = "sb_secret_N7UND0UgjKTVKUodkm0HgxSvEMPvz"
        result = _scrub({"info": key})
        assert result["info"] == MASKED_VALUE

    def test_non_sensitive_data_unchanged(self) -> None:
        result = _scrub({"event": "user.created", "user_id": "abc-123", "count": 42})
        assert result["event"] == "user.created"
        assert result["user_id"] == "abc-123"
        assert result["count"] == 42

    def test_nested_dict_scrubbed(self) -> None:
        result = _scrub(
            {
                "request": {
                    "headers": {
                        "authorization": "Bearer token123",
                    },
                    "path": "/api/v1/health",
                },
            }
        )
        headers = result["request"]["headers"]  # type: ignore[index]
        assert headers["authorization"] == MASKED_VALUE
        assert result["request"]["path"] == "/api/v1/health"  # type: ignore[index]

    def test_list_values_scrubbed(self) -> None:
        jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig"
        result = _scrub({"tokens": [jwt, "safe-string"]})
        tokens = result["tokens"]
        assert isinstance(tokens, list)
        assert tokens[0] == MASKED_VALUE
        assert tokens[1] == "safe-string"

    def test_empty_event_dict(self) -> None:
        result = _scrub({})
        assert result == {}

    def test_non_string_non_dict_values_unchanged(self) -> None:
        result = _scrub({"count": 42, "active": True, "ratio": 3.14, "data": None})
        assert result["count"] == 42
        assert result["active"] is True
        assert result["ratio"] == 3.14
        assert result["data"] is None
