import io

import pytest
from fastapi import UploadFile

from nstil.api.upload import UploadTooLargeError, read_upload_with_limit

_1KB = 1024


def _make_upload_file(data: bytes, content_type: str = "image/jpeg") -> UploadFile:
    return UploadFile(
        file=io.BytesIO(data),
        filename="test.bin",
        headers={"content-type": content_type},
    )


class TestReadUploadWithLimit:
    async def test_under_limit_returns_bytes(self) -> None:
        payload = b"\xff\xd8\xff" + b"\x00" * 500
        file = _make_upload_file(payload)

        result = await read_upload_with_limit(file, _1KB)

        assert result == payload

    async def test_exact_limit_succeeds(self) -> None:
        payload = b"\x00" * _1KB
        file = _make_upload_file(payload)

        result = await read_upload_with_limit(file, _1KB)

        assert result == payload
        assert len(result) == _1KB

    async def test_over_limit_raises(self) -> None:
        payload = b"\x00" * (_1KB + 1)
        file = _make_upload_file(payload)

        with pytest.raises(UploadTooLargeError) as exc_info:
            await read_upload_with_limit(file, _1KB)

        assert exc_info.value.max_bytes == _1KB

    async def test_empty_file_returns_empty_bytes(self) -> None:
        file = _make_upload_file(b"")

        result = await read_upload_with_limit(file, _1KB)

        assert result == b""

    async def test_large_file_stops_reading_early(self) -> None:
        large_payload = b"\x00" * (_1KB * 100)
        file = _make_upload_file(large_payload)

        with pytest.raises(UploadTooLargeError):
            await read_upload_with_limit(file, _1KB)

    async def test_multi_chunk_file_under_limit(self) -> None:
        payload = b"\xab" * (64 * _1KB + 500)
        file = _make_upload_file(payload)

        result = await read_upload_with_limit(file, 100 * _1KB)

        assert result == payload

    async def test_error_includes_max_bytes_in_message(self) -> None:
        file = _make_upload_file(b"\x00" * 200)

        with pytest.raises(UploadTooLargeError, match="100 bytes"):
            await read_upload_with_limit(file, 100)
