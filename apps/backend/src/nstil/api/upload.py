from typing import Final

from fastapi import UploadFile

_READ_CHUNK_SIZE: Final[int] = 64 * 1024


class UploadTooLargeError(Exception):
    def __init__(self, max_bytes: int) -> None:
        self.max_bytes = max_bytes
        super().__init__(f"File exceeds maximum size of {max_bytes} bytes")


async def read_upload_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    chunks = bytearray()
    bytes_read = 0

    while True:
        chunk = await file.read(_READ_CHUNK_SIZE)
        if not chunk:
            break

        bytes_read += len(chunk)
        if bytes_read > max_bytes:
            raise UploadTooLargeError(max_bytes)

        chunks.extend(chunk)

    return bytes(chunks)
