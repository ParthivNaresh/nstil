from nstil.services.rate_limit_config import classify_route, is_exempt


class TestIsExempt:
    def test_health_exempt(self) -> None:
        assert is_exempt("/api/v1/health") is True

    def test_docs_exempt(self) -> None:
        assert is_exempt("/docs") is True

    def test_openapi_exempt(self) -> None:
        assert is_exempt("/openapi.json") is True

    def test_api_entries_not_exempt(self) -> None:
        assert is_exempt("/api/v1/entries") is False

    def test_root_not_exempt(self) -> None:
        assert is_exempt("/") is False


class TestClassifyRoute:
    def test_media_upload(self) -> None:
        assert classify_route("POST", "/api/v1/entries/some-uuid/media") == "media_upload"

    def test_media_list_not_upload(self) -> None:
        assert classify_route("GET", "/api/v1/entries/some-uuid/media") is None

    def test_check_in_start(self) -> None:
        assert classify_route("POST", "/api/v1/check-in/start") == "ai"

    def test_check_in_respond(self) -> None:
        assert classify_route("POST", "/api/v1/check-in/some-uuid/respond") == "ai"

    def test_insights_generate(self) -> None:
        assert classify_route("POST", "/api/v1/insights/generate") == "ai"

    def test_prompts_generate(self) -> None:
        assert classify_route("POST", "/api/v1/ai/prompts/generate") == "ai"

    def test_search(self) -> None:
        assert classify_route("GET", "/api/v1/entries/search") == "search"

    def test_search_post_not_classified(self) -> None:
        assert classify_route("POST", "/api/v1/entries/search") == "write"

    def test_create_entry(self) -> None:
        assert classify_route("POST", "/api/v1/entries") == "write"

    def test_update_entry(self) -> None:
        assert classify_route("PATCH", "/api/v1/entries/some-uuid") == "write"

    def test_delete_entry(self) -> None:
        assert classify_route("DELETE", "/api/v1/entries/some-uuid") == "write"

    def test_create_journal(self) -> None:
        assert classify_route("POST", "/api/v1/journals") == "write"

    def test_list_entries_no_classification(self) -> None:
        assert classify_route("GET", "/api/v1/entries") is None

    def test_get_profile_no_classification(self) -> None:
        assert classify_route("GET", "/api/v1/profile") is None

    def test_get_ai_context_no_classification(self) -> None:
        assert classify_route("GET", "/api/v1/ai/context") is None
