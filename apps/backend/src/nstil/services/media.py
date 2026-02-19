from typing import Any
from uuid import UUID, uuid4

from supabase import AsyncClient

from nstil.models.media import (
    ALLOWED_CONTENT_TYPES,
    MAX_AUDIO_DURATION_MS,
    MAX_AUDIO_PER_ENTRY,
    MAX_IMAGES_PER_ENTRY,
    PREVIEW_LIMIT,
    EntryMediaRow,
    MediaPreview,
    MediaPreviewItem,
    is_audio_content_type,
    max_file_size_for_content_type,
)

TABLE = "entry_media"
BUCKET = "entry-media"
SIGNED_URL_EXPIRY = 3600


class MediaUploadError(Exception):
    pass


class MediaLimitExceededError(MediaUploadError):
    pass


class InvalidMediaTypeError(MediaUploadError):
    pass


class FileTooLargeError(MediaUploadError):
    pass


class AudioDurationExceededError(MediaUploadError):
    pass


class MediaService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    def _storage_path(self, user_id: UUID, entry_id: UUID, file_id: UUID, ext: str) -> str:
        return f"{user_id}/{entry_id}/{file_id}{ext}"

    async def _count_media_by_type(self, entry_id: UUID, audio: bool) -> int:
        result = await (
            self._client.table(TABLE)
            .select("id, content_type")
            .eq("entry_id", str(entry_id))
            .execute()
        )
        count = 0
        for item in result.data:
            raw: dict[str, Any] = item  # type: ignore[assignment]
            if is_audio_content_type(str(raw["content_type"])) == audio:
                count += 1
        return count

    async def _get_next_sort_order(self, entry_id: UUID) -> int:
        result = await (
            self._client.table(TABLE)
            .select("sort_order")
            .eq("entry_id", str(entry_id))
            .order("sort_order", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return 0
        row: dict[str, Any] = result.data[0]  # type: ignore[assignment]
        return int(row["sort_order"]) + 1

    async def upload(
        self,
        user_id: UUID,
        entry_id: UUID,
        file_bytes: bytes,
        file_name: str,
        content_type: str,
        width: int | None = None,
        height: int | None = None,
        duration_ms: int | None = None,
        waveform: list[float] | None = None,
    ) -> EntryMediaRow:
        if content_type not in ALLOWED_CONTENT_TYPES:
            msg = f"Content type '{content_type}' is not allowed"
            raise InvalidMediaTypeError(msg)

        max_size = max_file_size_for_content_type(content_type)
        if len(file_bytes) > max_size:
            msg = f"File exceeds maximum size of {max_size} bytes"
            raise FileTooLargeError(msg)

        is_audio = is_audio_content_type(content_type)

        if is_audio:
            if duration_ms is not None and duration_ms > MAX_AUDIO_DURATION_MS:
                msg = f"Audio exceeds maximum duration of {MAX_AUDIO_DURATION_MS}ms"
                raise AudioDurationExceededError(msg)

            audio_count = await self._count_media_by_type(entry_id, audio=True)
            if audio_count >= MAX_AUDIO_PER_ENTRY:
                msg = f"Maximum of {MAX_AUDIO_PER_ENTRY} audio file per entry"
                raise MediaLimitExceededError(msg)
        else:
            image_count = await self._count_media_by_type(entry_id, audio=False)
            if image_count >= MAX_IMAGES_PER_ENTRY:
                msg = f"Maximum of {MAX_IMAGES_PER_ENTRY} images per entry"
                raise MediaLimitExceededError(msg)

        ext = _extension_for_content_type(content_type)
        file_id = uuid4()
        storage_path = self._storage_path(user_id, entry_id, file_id, ext)
        sort_order = await self._get_next_sort_order(entry_id)

        await self._client.storage.from_(BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )

        result = await (
            self._client.table(TABLE)
            .insert(
                {
                    "entry_id": str(entry_id),
                    "user_id": str(user_id),
                    "storage_path": storage_path,
                    "file_name": file_name,
                    "content_type": content_type,
                    "size_bytes": len(file_bytes),
                    "width": width,
                    "height": height,
                    "duration_ms": duration_ms,
                    "waveform": waveform,
                    "sort_order": sort_order,
                }
            )
            .execute()
        )
        return EntryMediaRow.model_validate(result.data[0])

    async def list_media(self, entry_id: UUID, user_id: UUID) -> list[EntryMediaRow]:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("entry_id", str(entry_id))
            .eq("user_id", str(user_id))
            .order("sort_order")
            .execute()
        )
        return [EntryMediaRow.model_validate(row) for row in result.data]

    async def get_by_id(self, media_id: UUID, user_id: UUID) -> EntryMediaRow | None:
        result = await (
            self._client.table(TABLE)
            .select("*")
            .eq("id", str(media_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return EntryMediaRow.model_validate(result.data[0])

    async def delete(self, media_id: UUID, user_id: UUID) -> bool:
        media = await self.get_by_id(media_id, user_id)
        if media is None:
            return False

        await self._client.storage.from_(BUCKET).remove([media.storage_path])

        await (
            self._client.table(TABLE)
            .delete()
            .eq("id", str(media_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        return True

    async def create_signed_url(self, storage_path: str) -> str:
        result = await self._client.storage.from_(BUCKET).create_signed_url(
            path=storage_path,
            expires_in=SIGNED_URL_EXPIRY,
        )
        return str(result["signedURL"])

    async def create_signed_urls(self, paths: list[str]) -> list[str]:
        if not paths:
            return []
        results = await self._client.storage.from_(BUCKET).create_signed_urls(
            paths=paths,
            expires_in=SIGNED_URL_EXPIRY,
        )
        return [str(r["signedURL"]) for r in results]

    async def get_previews_for_entries(
        self, entry_ids: list[UUID], user_id: UUID
    ) -> dict[UUID, MediaPreview]:
        if not entry_ids:
            return {}

        str_ids = [str(eid) for eid in entry_ids]
        result = await (
            self._client.table(TABLE)
            .select("id, entry_id, storage_path, sort_order")
            .eq("user_id", str(user_id))
            .in_("entry_id", str_ids)
            .order("sort_order")
            .execute()
        )

        grouped: dict[UUID, list[dict[str, Any]]] = {}
        for row_data in result.data:
            raw: dict[str, Any] = row_data  # type: ignore[assignment]
            eid = UUID(str(raw["entry_id"]))
            grouped.setdefault(eid, []).append(raw)

        all_preview_paths: list[str] = []
        path_index_map: list[tuple[UUID, int]] = []

        for eid, rows in grouped.items():
            for i, raw in enumerate(rows[:PREVIEW_LIMIT]):
                all_preview_paths.append(str(raw["storage_path"]))
                path_index_map.append((eid, i))

        signed_urls = await self.create_signed_urls(all_preview_paths)

        url_map: dict[UUID, list[str]] = {}
        for idx, (eid, _) in enumerate(path_index_map):
            url_map.setdefault(eid, []).append(signed_urls[idx])

        previews: dict[UUID, MediaPreview] = {}
        for eid in entry_ids:
            rows = grouped.get(eid, [])
            urls = url_map.get(eid, [])
            items = [
                MediaPreviewItem(id=UUID(str(rows[i]["id"])), url=urls[i])
                for i in range(len(urls))
            ]
            previews[eid] = MediaPreview(items=items, total_count=len(rows))

        return previews


_EXTENSION_MAP: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/webp": ".webp",
    "audio/m4a": ".m4a",
    "audio/mp4": ".m4a",
    "audio/aac": ".aac",
    "audio/wav": ".wav",
    "audio/mpeg": ".mp3",
    "audio/x-m4a": ".m4a",
}


def _extension_for_content_type(content_type: str) -> str:
    return _EXTENSION_MAP.get(content_type, ".bin")
