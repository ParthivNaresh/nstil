import pytest
from pydantic import ValidationError

from nstil.models.profile import ProfileResponse, ProfileUpdate
from tests.factories import make_profile_row


class TestProfileUpdate:
    def test_display_name_accepted(self) -> None:
        update = ProfileUpdate(display_name="Parthiv")
        assert update.display_name == "Parthiv"

    def test_display_name_stripped(self) -> None:
        update = ProfileUpdate(display_name="  Parthiv  ")
        assert update.display_name == "Parthiv"

    def test_display_name_empty_becomes_none(self) -> None:
        update = ProfileUpdate(display_name="   ")
        assert update.display_name is None

    def test_display_name_null_accepted(self) -> None:
        update = ProfileUpdate(display_name=None)
        assert update.display_name is None

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            ProfileUpdate()

    def test_display_name_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ProfileUpdate(display_name="x" * 101)

    def test_display_name_max_length_accepted(self) -> None:
        update = ProfileUpdate(display_name="x" * 100)
        assert len(update.display_name) == 100

    def test_to_update_dict_includes_set_fields(self) -> None:
        update = ProfileUpdate(display_name="Parthiv")
        result = update.to_update_dict()
        assert result == {"display_name": "Parthiv"}

    def test_to_update_dict_includes_null_when_explicitly_set(self) -> None:
        update = ProfileUpdate(display_name=None)
        result = update.to_update_dict()
        assert result == {"display_name": None}


class TestProfileResponse:
    def test_from_row(self) -> None:
        row = make_profile_row(display_name="Parthiv")
        response = ProfileResponse.from_row(row)
        assert response.id == row.id
        assert response.display_name == "Parthiv"
        assert response.avatar_url is None
        assert response.onboarding_completed_at is None
        assert response.created_at == row.created_at
        assert response.updated_at == row.updated_at

    def test_from_row_with_onboarding(self) -> None:
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        row = make_profile_row(onboarding_completed_at=now)
        response = ProfileResponse.from_row(row)
        assert response.onboarding_completed_at == now

    def test_from_row_nullable_fields(self) -> None:
        row = make_profile_row()
        response = ProfileResponse.from_row(row)
        assert response.display_name is None
        assert response.avatar_url is None
        assert response.onboarding_completed_at is None


class TestProfileRow:
    def test_extra_fields_ignored(self) -> None:
        row = make_profile_row()
        data = row.model_dump()
        data["unknown_field"] = "should be ignored"
        from nstil.models.profile import ProfileRow

        parsed = ProfileRow.model_validate(data)
        assert not hasattr(parsed, "unknown_field")
