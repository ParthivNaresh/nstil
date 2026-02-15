import io
import uuid
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from nstil.services.media import MediaLimitExceededError
from tests.factories import DEFAULT_USER_ID, make_entry_row, make_media_row, make_token

ENTRY_ID = str(uuid.uuid4())
MEDIA_URL = f"/api/v1/entries/{ENTRY_ID}/media"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


def _jpeg_file(size: int = 1024) -> tuple[str, io.BytesIO, str]:
    return ("file", io.BytesIO(b"\xff\xd8\xff" + b"\x00" * (size - 3)), "image/jpeg")


class TestUploadMedia:
    def test_upload_success(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row

        media_row = make_media_row(entry_id=ENTRY_ID)
        mock_media_service.upload.return_value = media_row
        mock_media_service.create_signed_url.return_value = "https://example.com/signed"

        response = client.post(
            MEDIA_URL,
            files={"file": _jpeg_file()},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["file_name"] == "photo.jpg"
        assert data["content_type"] == "image/jpeg"
        assert data["url"] == "https://example.com/signed"
        assert data["entry_id"] == ENTRY_ID
        mock_media_service.upload.assert_called_once()

    def test_upload_entry_not_found(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
    ) -> None:
        mock_journal_service.get_by_id.return_value = None

        response = client.post(
            MEDIA_URL,
            files={"file": _jpeg_file()},
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_upload_invalid_content_type(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row

        response = client.post(
            MEDIA_URL,
            files={"file": ("file.txt", io.BytesIO(b"hello"), "text/plain")},
            headers=_auth_headers(),
        )

        assert response.status_code == 422

    def test_upload_max_count_exceeded(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row
        mock_media_service.upload.side_effect = MediaLimitExceededError(
            "Maximum of 10 media items per entry"
        )

        response = client.post(
            MEDIA_URL,
            files={"file": _jpeg_file()},
            headers=_auth_headers(),
        )

        assert response.status_code == 422
        assert "10" in response.json()["detail"]

    def test_upload_requires_auth(self, client: TestClient) -> None:
        response = client.post(MEDIA_URL, files={"file": _jpeg_file()})
        assert response.status_code in (401, 403)


class TestListMedia:
    def test_list_empty(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row
        mock_media_service.list_media.return_value = []

        response = client.get(MEDIA_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["count"] == 0

    def test_list_with_items(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row

        rows = [make_media_row(entry_id=ENTRY_ID, sort_order=i) for i in range(3)]
        mock_media_service.list_media.return_value = rows
        mock_media_service.create_signed_urls.return_value = [
            f"https://example.com/signed/{i}" for i in range(3)
        ]

        response = client.get(MEDIA_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["count"] == 3
        assert data["items"][0]["url"].startswith("https://")

    def test_list_entry_not_found(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
    ) -> None:
        mock_journal_service.get_by_id.return_value = None

        response = client.get(MEDIA_URL, headers=_auth_headers())

        assert response.status_code == 404

    def test_list_requires_auth(self, client: TestClient) -> None:
        response = client.get(MEDIA_URL)
        assert response.status_code in (401, 403)


class TestDeleteMedia:
    def test_delete_success(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row
        mock_media_service.delete.return_value = True

        media_id = uuid.uuid4()
        response = client.delete(
            f"{MEDIA_URL}/{media_id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 204
        mock_media_service.delete.assert_called_once()

    def test_delete_not_found(
        self,
        client: TestClient,
        mock_media_service: AsyncMock,
        mock_journal_service: AsyncMock,
    ) -> None:
        entry_row = make_entry_row(entry_id=ENTRY_ID)
        mock_journal_service.get_by_id.return_value = entry_row
        mock_media_service.delete.return_value = False

        media_id = uuid.uuid4()
        response = client.delete(
            f"{MEDIA_URL}/{media_id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_delete_entry_not_found(
        self,
        client: TestClient,
        mock_journal_service: AsyncMock,
    ) -> None:
        mock_journal_service.get_by_id.return_value = None

        media_id = uuid.uuid4()
        response = client.delete(
            f"{MEDIA_URL}/{media_id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_delete_requires_auth(self, client: TestClient) -> None:
        media_id = uuid.uuid4()
        response = client.delete(f"{MEDIA_URL}/{media_id}")
        assert response.status_code in (401, 403)
