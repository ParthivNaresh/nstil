import uuid
from datetime import UTC, datetime

from nstil.models.media import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_MEDIA_PER_ENTRY,
    EntryMediaListResponse,
    EntryMediaResponse,
    EntryMediaRow,
    MediaContentType,
)


class TestMediaContentType:
    def test_all_types_in_allowed_set(self) -> None:
        for ct in MediaContentType:
            assert ct.value in ALLOWED_CONTENT_TYPES

    def test_allowed_count(self) -> None:
        assert len(ALLOWED_CONTENT_TYPES) == 4

    def test_extensions_map_to_valid_types(self) -> None:
        for ext, ct in ALLOWED_EXTENSIONS.items():
            assert ct.value in ALLOWED_CONTENT_TYPES
            assert ext.startswith(".")


class TestMediaConstants:
    def test_max_file_size(self) -> None:
        assert MAX_FILE_SIZE_BYTES == 10 * 1024 * 1024

    def test_max_per_entry(self) -> None:
        assert MAX_MEDIA_PER_ENTRY == 10


class TestEntryMediaRow:
    def test_parse_full(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.jpg",
            file_name="photo.jpg",
            content_type="image/jpeg",
            size_bytes=5000,
            width=1920,
            height=1080,
            sort_order=0,
            created_at=now,
        )
        assert row.size_bytes == 5000
        assert row.width == 1920

    def test_parse_without_dimensions(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.jpg",
            file_name="photo.jpg",
            content_type="image/jpeg",
            size_bytes=5000,
            width=None,
            height=None,
            sort_order=0,
            created_at=now,
        )
        assert row.width is None
        assert row.height is None

    def test_extra_fields_ignored(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.jpg",
            file_name="photo.jpg",
            content_type="image/jpeg",
            size_bytes=5000,
            width=None,
            height=None,
            sort_order=0,
            created_at=now,
            unknown_field="ignored",  # type: ignore[call-arg]
        )
        assert not hasattr(row, "unknown_field")


class TestEntryMediaResponse:
    def test_from_row(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.jpg",
            file_name="sunset.png",
            content_type="image/png",
            size_bytes=2048,
            width=640,
            height=480,
            sort_order=1,
            created_at=now,
        )
        resp = EntryMediaResponse.from_row(row, "https://example.com/signed")
        assert resp.id == row.id
        assert resp.entry_id == row.entry_id
        assert resp.file_name == "sunset.png"
        assert resp.url == "https://example.com/signed"
        assert resp.width == 640
        assert resp.sort_order == 1


class TestEntryMediaListResponse:
    def test_empty_list(self) -> None:
        resp = EntryMediaListResponse(items=[], count=0)
        assert resp.items == []
        assert resp.count == 0

    def test_with_items(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="path",
            file_name="a.jpg",
            content_type="image/jpeg",
            size_bytes=100,
            width=None,
            height=None,
            sort_order=0,
            created_at=now,
        )
        item = EntryMediaResponse.from_row(row, "https://url")
        resp = EntryMediaListResponse(items=[item], count=1)
        assert resp.count == 1
        assert len(resp.items) == 1
