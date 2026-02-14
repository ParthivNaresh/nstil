from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from nstil.models.journal import (
    MAX_TAG_COUNT,
    MAX_TAG_LENGTH,
    EntryType,
    JournalEntryCreate,
    JournalEntryResponse,
    JournalEntryUpdate,
)
from tests.factories import make_entry_row


class TestJournalEntryCreate:
    def test_minimal(self) -> None:
        entry = JournalEntryCreate(body="Hello")
        assert entry.body == "Hello"
        assert entry.title == ""
        assert entry.mood_score is None
        assert entry.tags == []
        assert entry.location is None
        assert entry.entry_type == EntryType.JOURNAL

    def test_all_fields(self) -> None:
        entry = JournalEntryCreate(
            title="My Day",
            body="Great day",
            mood_score=5,
            tags=["happy"],
            location="NYC",
            entry_type=EntryType.GRATITUDE,
        )
        assert entry.title == "My Day"
        assert entry.mood_score == 5
        assert entry.entry_type == EntryType.GRATITUDE

    def test_body_stripped(self) -> None:
        entry = JournalEntryCreate(body="  hello  ")
        assert entry.body == "hello"

    def test_title_stripped(self) -> None:
        entry = JournalEntryCreate(body="test", title="  My Title  ")
        assert entry.title == "My Title"

    def test_whitespace_only_body_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="   ")

    def test_empty_body_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="")

    def test_mood_below_min_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="test", mood_score=0)

    def test_mood_above_max_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="test", mood_score=6)

    def test_tags_stripped(self) -> None:
        entry = JournalEntryCreate(body="test", tags=["  happy  ", "  sad  "])
        assert entry.tags == ["happy", "sad"]

    def test_empty_tags_removed(self) -> None:
        entry = JournalEntryCreate(body="test", tags=["happy", "", "  ", "sad"])
        assert entry.tags == ["happy", "sad"]

    def test_too_many_tags_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(
                body="test",
                tags=[f"tag{i}" for i in range(MAX_TAG_COUNT + 1)],
            )

    def test_tag_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="test", tags=["x" * (MAX_TAG_LENGTH + 1)])

    def test_invalid_entry_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="test", entry_type="invalid")

    def test_created_at_defaults_none(self) -> None:
        entry = JournalEntryCreate(body="test")
        assert entry.created_at is None

    def test_created_at_past_accepted(self) -> None:
        past = datetime(2025, 1, 15, 10, 30, tzinfo=UTC)
        entry = JournalEntryCreate(body="test", created_at=past)
        assert entry.created_at == past

    def test_created_at_future_rejected(self) -> None:
        future = datetime.now(UTC) + timedelta(hours=1)
        with pytest.raises(ValidationError, match="future"):
            JournalEntryCreate(body="test", created_at=future)

    def test_created_at_naive_gets_utc(self) -> None:
        naive = datetime(2025, 6, 1, 12, 0)
        entry = JournalEntryCreate(body="test", created_at=naive)
        assert entry.created_at is not None
        assert entry.created_at.tzinfo is not None


class TestJournalEntryUpdate:
    def test_single_field(self) -> None:
        update = JournalEntryUpdate(title="New Title")
        assert update.title == "New Title"
        assert update.body is None

    def test_multiple_fields(self) -> None:
        update = JournalEntryUpdate(title="New", body="Updated body", mood_score=4)
        assert update.title == "New"
        assert update.body == "Updated body"
        assert update.mood_score == 4

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            JournalEntryUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = JournalEntryUpdate(title="New", mood_score=3)
        result = update.to_update_dict()
        assert result == {"title": "New", "mood_score": 3}
        assert "body" not in result
        assert "tags" not in result

    def test_tags_stripped(self) -> None:
        update = JournalEntryUpdate(tags=["  happy  "])
        assert update.tags == ["happy"]

    def test_tags_empty_strings_removed(self) -> None:
        update = JournalEntryUpdate(tags=["happy", "", "  "])
        assert update.tags == ["happy"]

    def test_body_stripped(self) -> None:
        update = JournalEntryUpdate(body="  hello  ")
        assert update.body == "hello"

    def test_whitespace_only_body_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryUpdate(body="   ")

    def test_created_at_past_accepted(self) -> None:
        past = datetime(2025, 3, 10, 8, 0, tzinfo=UTC)
        update = JournalEntryUpdate(created_at=past)
        assert update.created_at == past

    def test_created_at_future_rejected(self) -> None:
        future = datetime.now(UTC) + timedelta(hours=1)
        with pytest.raises(ValidationError, match="future"):
            JournalEntryUpdate(created_at=future)

    def test_to_update_dict_includes_created_at(self) -> None:
        past = datetime(2025, 3, 10, 8, 0, tzinfo=UTC)
        update = JournalEntryUpdate(created_at=past)
        result = update.to_update_dict()
        assert "created_at" in result
        assert isinstance(result["created_at"], str)


class TestJournalEntryResponse:
    def test_from_row(self) -> None:
        row = make_entry_row(
            title="Test",
            body="Body",
            mood_score=4,
            tags=["tag1"],
            location="NYC",
        )
        response = JournalEntryResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.title == "Test"
        assert response.body == "Body"
        assert response.mood_score == 4
        assert response.tags == ["tag1"]
        assert response.location == "NYC"
        assert response.created_at == row.created_at
        assert response.updated_at == row.updated_at

    def test_from_row_excludes_deleted_at(self) -> None:
        row = make_entry_row()
        response = JournalEntryResponse.from_row(row)
        assert not hasattr(response, "deleted_at")

    def test_from_row_excludes_metadata(self) -> None:
        row = make_entry_row()
        response = JournalEntryResponse.from_row(row)
        assert not hasattr(response, "metadata")
