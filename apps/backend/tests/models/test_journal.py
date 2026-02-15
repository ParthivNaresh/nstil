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
from tests.factories import DEFAULT_JOURNAL_ID, make_entry_row

JID = DEFAULT_JOURNAL_ID


class TestJournalEntryCreate:
    def test_minimal(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="Hello")
        assert entry.body == "Hello"
        assert entry.title == ""
        assert entry.mood_category is None
        assert entry.mood_specific is None
        assert entry.tags == []
        assert entry.location is None
        assert entry.entry_type == EntryType.JOURNAL

    def test_all_fields(self) -> None:
        entry = JournalEntryCreate(
            journal_id=JID,
            title="My Day",
            body="Great day",
            mood_category="happy",
            mood_specific="grateful",
            tags=["happy"],
            location="NYC",
            entry_type=EntryType.GRATITUDE,
        )
        assert entry.title == "My Day"
        assert entry.mood_category == "happy"
        assert entry.mood_specific == "grateful"
        assert entry.entry_type == EntryType.GRATITUDE

    def test_mood_category_only(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="test", mood_category="sad")
        assert entry.mood_category == "sad"
        assert entry.mood_specific is None

    def test_mood_specific_without_category_rejected(self) -> None:
        with pytest.raises(ValidationError, match="mood_specific requires mood_category"):
            JournalEntryCreate(journal_id=JID, body="test", mood_specific="grateful")

    def test_mood_specific_wrong_category_rejected(self) -> None:
        with pytest.raises(ValidationError, match="not valid for category"):
            JournalEntryCreate(
                journal_id=JID, body="test", mood_category="happy", mood_specific="stressed"
            )

    def test_invalid_mood_category_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(journal_id=JID, body="test", mood_category="ecstatic")

    def test_invalid_mood_specific_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(
                journal_id=JID, body="test", mood_category="happy", mood_specific="blissful"
            )

    def test_body_stripped(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="  hello  ")
        assert entry.body == "hello"

    def test_title_stripped(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="test", title="  My Title  ")
        assert entry.title == "My Title"

    def test_whitespace_only_body_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(journal_id=JID, body="   ")

    def test_empty_body_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(journal_id=JID, body="")

    def test_tags_stripped(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="test", tags=["  happy  ", "  sad  "])
        assert entry.tags == ["happy", "sad"]

    def test_empty_tags_removed(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="test", tags=["happy", "", "  ", "sad"])
        assert entry.tags == ["happy", "sad"]

    def test_too_many_tags_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(
                journal_id=JID,
                body="test",
                tags=[f"tag{i}" for i in range(MAX_TAG_COUNT + 1)],
            )

    def test_tag_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(journal_id=JID, body="test", tags=["x" * (MAX_TAG_LENGTH + 1)])

    def test_invalid_entry_type_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(journal_id=JID, body="test", entry_type="invalid")

    def test_created_at_defaults_none(self) -> None:
        entry = JournalEntryCreate(journal_id=JID, body="test")
        assert entry.created_at is None

    def test_created_at_past_accepted(self) -> None:
        past = datetime(2025, 1, 15, 10, 30, tzinfo=UTC)
        entry = JournalEntryCreate(journal_id=JID, body="test", created_at=past)
        assert entry.created_at == past

    def test_created_at_future_rejected(self) -> None:
        future = datetime.now(UTC) + timedelta(hours=1)
        with pytest.raises(ValidationError, match="future"):
            JournalEntryCreate(journal_id=JID, body="test", created_at=future)

    def test_created_at_naive_gets_utc(self) -> None:
        naive = datetime(2025, 6, 1, 12, 0)
        entry = JournalEntryCreate(journal_id=JID, body="test", created_at=naive)
        assert entry.created_at is not None
        assert entry.created_at.tzinfo is not None

    def test_missing_journal_id_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JournalEntryCreate(body="test")


class TestJournalEntryUpdate:
    def test_single_field(self) -> None:
        update = JournalEntryUpdate(title="New Title")
        assert update.title == "New Title"
        assert update.body is None

    def test_multiple_fields(self) -> None:
        update = JournalEntryUpdate(
            title="New", body="Updated body", mood_category="happy", mood_specific="proud"
        )
        assert update.title == "New"
        assert update.body == "Updated body"
        assert update.mood_category == "happy"
        assert update.mood_specific == "proud"

    def test_mood_category_only(self) -> None:
        update = JournalEntryUpdate(mood_category="anxious")
        assert update.mood_category == "anxious"
        assert update.mood_specific is None

    def test_mood_specific_without_category_rejected(self) -> None:
        with pytest.raises(ValidationError, match="mood_specific requires mood_category"):
            JournalEntryUpdate(mood_specific="stressed")

    def test_mood_specific_wrong_category_rejected(self) -> None:
        with pytest.raises(ValidationError, match="not valid for category"):
            JournalEntryUpdate(mood_category="sad", mood_specific="excited")

    def test_empty_update_rejected(self) -> None:
        with pytest.raises(ValidationError, match="At least one field"):
            JournalEntryUpdate()

    def test_to_update_dict_excludes_none(self) -> None:
        update = JournalEntryUpdate(title="New", mood_category="calm")
        result = update.to_update_dict()
        assert result == {"title": "New", "mood_category": "calm"}
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

    def test_journal_id_update(self) -> None:
        update = JournalEntryUpdate(journal_id="00000000-0000-0000-0000-000000000020")
        result = update.to_update_dict()
        assert result == {"journal_id": "00000000-0000-0000-0000-000000000020"}


class TestJournalEntryResponse:
    def test_from_row(self) -> None:
        row = make_entry_row(
            title="Test",
            body="Body",
            mood_category="happy",
            mood_specific="excited",
            tags=["tag1"],
            location="NYC",
        )
        response = JournalEntryResponse.from_row(row)
        assert response.id == row.id
        assert response.user_id == row.user_id
        assert response.journal_id == row.journal_id
        assert response.title == "Test"
        assert response.body == "Body"
        assert response.mood_category == "happy"
        assert response.mood_specific == "excited"
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
