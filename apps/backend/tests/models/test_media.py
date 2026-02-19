import uuid
from datetime import UTC, datetime

from nstil.models.media import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    AUDIO_CONTENT_TYPES,
    IMAGE_CONTENT_TYPES,
    MAX_AUDIO_DURATION_MS,
    MAX_AUDIO_FILE_SIZE_BYTES,
    MAX_AUDIO_PER_ENTRY,
    MAX_IMAGE_FILE_SIZE_BYTES,
    MAX_IMAGES_PER_ENTRY,
    EntryMediaListResponse,
    EntryMediaResponse,
    EntryMediaRow,
    MediaContentType,
    is_audio_content_type,
    max_file_size_for_content_type,
)


class TestMediaContentType:
    def test_all_types_in_allowed_set(self) -> None:
        for ct in MediaContentType:
            assert ct.value in ALLOWED_CONTENT_TYPES

    def test_image_types_count(self) -> None:
        assert len(IMAGE_CONTENT_TYPES) == 4

    def test_audio_types_count(self) -> None:
        assert len(AUDIO_CONTENT_TYPES) == 6

    def test_allowed_count(self) -> None:
        assert len(ALLOWED_CONTENT_TYPES) == 10

    def test_no_overlap_between_image_and_audio(self) -> None:
        assert frozenset() == IMAGE_CONTENT_TYPES & AUDIO_CONTENT_TYPES

    def test_image_and_audio_cover_all(self) -> None:
        assert IMAGE_CONTENT_TYPES | AUDIO_CONTENT_TYPES == ALLOWED_CONTENT_TYPES

    def test_extensions_map_to_valid_types(self) -> None:
        for ext, ct in ALLOWED_EXTENSIONS.items():
            assert ct.value in ALLOWED_CONTENT_TYPES
            assert ext.startswith(".")

    def test_is_audio_content_type(self) -> None:
        assert is_audio_content_type("audio/m4a") is True
        assert is_audio_content_type("audio/mp4") is True
        assert is_audio_content_type("audio/aac") is True
        assert is_audio_content_type("audio/wav") is True
        assert is_audio_content_type("audio/mpeg") is True
        assert is_audio_content_type("audio/x-m4a") is True
        assert is_audio_content_type("image/jpeg") is False
        assert is_audio_content_type("image/png") is False

    def test_max_file_size_for_content_type(self) -> None:
        assert max_file_size_for_content_type("image/jpeg") == MAX_IMAGE_FILE_SIZE_BYTES
        assert max_file_size_for_content_type("audio/m4a") == MAX_AUDIO_FILE_SIZE_BYTES


class TestMediaConstants:
    def test_max_image_file_size(self) -> None:
        assert MAX_IMAGE_FILE_SIZE_BYTES == 10 * 1024 * 1024

    def test_max_audio_file_size(self) -> None:
        assert MAX_AUDIO_FILE_SIZE_BYTES == 25 * 1024 * 1024

    def test_max_images_per_entry(self) -> None:
        assert MAX_IMAGES_PER_ENTRY == 10

    def test_max_audio_per_entry(self) -> None:
        assert MAX_AUDIO_PER_ENTRY == 1

    def test_max_audio_duration(self) -> None:
        assert MAX_AUDIO_DURATION_MS == 300_000


class TestEntryMediaRow:
    def test_parse_image(self) -> None:
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
            duration_ms=None,
            sort_order=0,
            created_at=now,
        )
        assert row.size_bytes == 5000
        assert row.width == 1920
        assert row.duration_ms is None

    def test_parse_audio(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.m4a",
            file_name="voice.m4a",
            content_type="audio/m4a",
            size_bytes=50000,
            width=None,
            height=None,
            duration_ms=120000,
            sort_order=0,
            created_at=now,
        )
        assert row.duration_ms == 120000
        assert row.width is None

    def test_parse_without_dimensions_or_duration(self) -> None:
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
            duration_ms=None,
            sort_order=0,
            created_at=now,
        )
        assert row.width is None
        assert row.height is None
        assert row.duration_ms is None

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
            duration_ms=None,
            sort_order=0,
            created_at=now,
            unknown_field="ignored",  # type: ignore[call-arg]
        )
        assert not hasattr(row, "unknown_field")


class TestEntryMediaResponse:
    def test_from_row_image(self) -> None:
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
            duration_ms=None,
            sort_order=1,
            created_at=now,
        )
        resp = EntryMediaResponse.from_row(row, "https://example.com/signed")
        assert resp.id == row.id
        assert resp.entry_id == row.entry_id
        assert resp.file_name == "sunset.png"
        assert resp.url == "https://example.com/signed"
        assert resp.width == 640
        assert resp.duration_ms is None
        assert resp.sort_order == 1

    def test_from_row_audio(self) -> None:
        now = datetime.now(UTC)
        row = EntryMediaRow(
            id=uuid.uuid4(),
            entry_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            storage_path="user/entry/file.m4a",
            file_name="voice.m4a",
            content_type="audio/m4a",
            size_bytes=100000,
            width=None,
            height=None,
            duration_ms=60000,
            sort_order=0,
            created_at=now,
        )
        resp = EntryMediaResponse.from_row(row, "https://example.com/audio")
        assert resp.duration_ms == 60000
        assert resp.width is None
        assert resp.content_type == "audio/m4a"


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
            duration_ms=None,
            sort_order=0,
            created_at=now,
        )
        item = EntryMediaResponse.from_row(row, "https://url")
        resp = EntryMediaListResponse(items=[item], count=1)
        assert resp.count == 1
        assert len(resp.items) == 1
