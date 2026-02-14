import pytest
from pydantic import ValidationError

from nstil.models.pagination import CursorParams


class TestCursorParams:
    def test_defaults(self) -> None:
        params = CursorParams()
        assert params.cursor is None
        assert params.limit == 20

    def test_custom_values(self) -> None:
        params = CursorParams(cursor="2025-01-01T00:00:00Z", limit=50)
        assert params.cursor == "2025-01-01T00:00:00Z"
        assert params.limit == 50

    def test_limit_min(self) -> None:
        params = CursorParams(limit=1)
        assert params.limit == 1

    def test_limit_max(self) -> None:
        params = CursorParams(limit=100)
        assert params.limit == 100

    def test_limit_below_min_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CursorParams(limit=0)

    def test_limit_above_max_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CursorParams(limit=101)
