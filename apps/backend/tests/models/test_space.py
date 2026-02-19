import pytest
from pydantic import ValidationError

from nstil.models.space import (
    JournalSpaceCreate,
    JournalSpaceResponse,
    JournalSpaceUpdate,
)
from tests.factories import make_space_row


class TestJournalSpaceCreate:
    def test_minimal(self) -> None:
        space = JournalSpaceCreate(name="Work")
        assert space.name == "Work"
        assert space.description is None
        assert space.color is None
        assert space.icon is None

    def test_all_fields(self) -> None:
        space = JournalSpaceCreate(
            name="Dream Log",
            description="Nightly dreams",
            color="#FF6B6B",
            icon="moon",
        )
        assert space.name == "Dream Log"
        assert space.description == "Nightly dreams"
        assert space.color == "#FF6B6B"
        assert space.icon == "moon"

    def test_name_stripped(self) -> None:
        space = JournalSpaceCreate(name="  Work Stress  ")
        assert space.name == "Work Stress"

    def test_empty_name_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalSpaceCreate(name="")

    def test_whitespace_only_name_rejected(self) -> None:
        with pytest.raises(ValidationError, match="blank"):
            JournalSpaceCreate(name="   ")

    def test_name_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalSpaceCreate(name="x" * 101)

    def test_description_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalSpaceCreate(name="Work", description="x" * 501)

    def test_description_stripped(self) -> None:
        space = JournalSpaceCreate(name="Work", description="  Notes  ")
        assert space.description == "Notes"

    def test_description_whitespace_becomes_none(self) -> None:
        space = JournalSpaceCreate(name="Work", description="   ")
        assert space.description is None

    def test_valid_hex_color(self) -> None:
        space = JournalSpaceCreate(name="Work", color="#ff6b6b")
        assert space.color == "#FF6B6B"

    def test_invalid_hex_color_rejected(self) -> None:
        with pytest.raises(ValidationError, match="hex color"):
            JournalSpaceCreate(name="Work", color="red")

    def test_invalid_hex_short_rejected(self) -> None:
        with pytest.raises(ValidationError, match="hex color"):
            JournalSpaceCreate(name="Work", color="#FFF")

    def test_icon_stripped_and_lowered(self) -> None:
        space = JournalSpaceCreate(name="Work", icon="  Moon  ")
        assert space.icon == "moon"

    def test_icon_whitespace_becomes_none(self) -> None:
        space = JournalSpaceCreate(name="Work", icon="   ")
        assert space.icon is None


class TestJournalSpaceUpdate:
    def test_single_field(self) -> None:
        update = JournalSpaceUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.description is None

    def test_multiple_fields(self) -> None:
        update = JournalSpaceUpdate(
            name="Updated", color="#AABBCC", sort_order=5
        )
        assert update.name == "Updated"
        assert update.color == "#AABBCC"
        assert update.sort_order == 5

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            JournalSpaceUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = JournalSpaceUpdate(name="New", color="#112233")
        result = update.to_update_dict()
        assert result == {"name": "New", "color": "#112233"}
        assert "description" not in result
        assert "icon" not in result

    def test_whitespace_name_rejected(self) -> None:
        with pytest.raises(ValidationError, match="blank"):
            JournalSpaceUpdate(name="   ")

    def test_invalid_color_rejected(self) -> None:
        with pytest.raises(ValidationError, match="hex color"):
            JournalSpaceUpdate(color="notacolor")

    def test_sort_order_update(self) -> None:
        update = JournalSpaceUpdate(sort_order=3)
        result = update.to_update_dict()
        assert result == {"sort_order": 3}


class TestJournalSpaceResponse:
    def test_from_row(self) -> None:
        row = make_space_row(
            name="Work",
            description="Work stuff",
            color="#FF0000",
            icon="briefcase",
            sort_order=1,
        )
        response = JournalSpaceResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.name == "Work"
        assert response.description == "Work stuff"
        assert response.color == "#FF0000"
        assert response.icon == "briefcase"
        assert response.sort_order == 1
        assert response.created_at == row.created_at
        assert response.updated_at == row.updated_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_space_row()
        response = JournalSpaceResponse.from_row(row)
        assert not hasattr(response, "deleted_at")
