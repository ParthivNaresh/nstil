import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import DEFAULT_JOURNAL_ID, DEFAULT_USER_ID, make_entry_row, make_token

ENTRIES_URL = "/api/v1/entries"
JID = DEFAULT_JOURNAL_ID


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestCreateEntry:
    def test_create_minimal(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(body="Hello world")
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "Hello world"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["body"] == "Hello world"
        assert data["id"] == str(row.id)
        assert data["user_id"] == DEFAULT_USER_ID
        assert data["journal_id"] == JID
        mock_journal_service.create.assert_called_once()

    def test_create_all_fields(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(
            title="My Day",
            body="Great day today",
            mood_category="happy",
            mood_specific="grateful",
            tags=["happy", "work"],
            location="New York",
            entry_type="gratitude",
        )
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={
                "journal_id": JID,
                "title": "My Day",
                "body": "Great day today",
                "mood_category": "happy",
                "mood_specific": "grateful",
                "tags": ["happy", "work"],
                "location": "New York",
                "entry_type": "gratitude",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My Day"
        assert data["mood_category"] == "happy"
        assert data["mood_specific"] == "grateful"
        assert data["tags"] == ["happy", "work"]
        assert data["location"] == "New York"
        assert data["entry_type"] == "gratitude"

    def test_create_empty_body_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": ""},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_missing_body_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "title": "No body"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_missing_journal_id_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"body": "test"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_invalid_mood_category_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "test", "mood_category": "ecstatic"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_mood_specific_without_category_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "test", "mood_specific": "grateful"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_mood_wrong_pair_rejected(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={
                "journal_id": JID,
                "body": "test",
                "mood_category": "happy",
                "mood_specific": "stressed",
            },
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_too_many_tags(self, client: TestClient) -> None:
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "test", "tags": [f"tag{i}" for i in range(11)]},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_passes_user_id_from_token(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        custom_user = "11111111-1111-1111-1111-111111111111"
        row = make_entry_row(user_id=custom_user)
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "test"},
            headers=_auth_headers(sub=custom_user),
        )

        assert response.status_code == 201
        call_args = mock_journal_service.create.call_args
        assert str(call_args[0][0]) == custom_user

    def test_create_requires_auth(self, client: TestClient) -> None:
        response = client.post(ENTRIES_URL, json={"journal_id": JID, "body": "test"})
        assert response.status_code in (401, 403)


class TestGetEntry:
    def test_get_existing(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row()
        mock_journal_service.get_by_id.return_value = row

        response = client.get(
            f"{ENTRIES_URL}/{row.id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(row.id)
        assert data["body"] == row.body
        assert data["journal_id"] == str(row.journal_id)

    def test_get_not_found(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.get_by_id.return_value = None

        response = client.get(
            f"{ENTRIES_URL}/{uuid.uuid4()}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_get_requires_auth(self, client: TestClient) -> None:
        response = client.get(f"{ENTRIES_URL}/{uuid.uuid4()}")
        assert response.status_code in (401, 403)


class TestListEntries:
    def test_list_empty(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.list_entries.return_value = ([], False)

        response = client.get(ENTRIES_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["has_more"] is False
        assert data["next_cursor"] is None

    def test_list_with_entries(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        rows = [make_entry_row(body=f"Entry {i}") for i in range(3)]
        mock_journal_service.list_entries.return_value = (rows, False)

        response = client.get(ENTRIES_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["has_more"] is False

    def test_list_with_pagination(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        now = datetime.now(UTC)
        rows = [
            make_entry_row(
                body=f"Entry {i}",
                created_at=now - timedelta(hours=i),
            )
            for i in range(2)
        ]
        mock_journal_service.list_entries.return_value = (rows, True)

        response = client.get(
            ENTRIES_URL,
            params={"limit": 2},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["has_more"] is True
        assert data["next_cursor"] is not None

    def test_list_with_cursor(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.list_entries.return_value = ([], False)
        cursor = datetime.now(UTC).isoformat()

        response = client.get(
            ENTRIES_URL,
            params={"cursor": cursor, "limit": 10},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        mock_journal_service.list_entries.assert_called_once()

    def test_list_filtered_by_journal(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        journal_uuid = uuid.UUID(JID)
        rows = [make_entry_row(journal_id=JID, body="Filtered")]
        mock_journal_service.list_entries.return_value = (rows, False)

        response = client.get(
            ENTRIES_URL,
            params={"journal_id": JID},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        call_args = mock_journal_service.list_entries.call_args
        assert call_args.kwargs["journal_id"] == journal_uuid

    def test_list_requires_auth(self, client: TestClient) -> None:
        response = client.get(ENTRIES_URL)
        assert response.status_code in (401, 403)


class TestUpdateEntry:
    def test_update_single_field(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(title="Updated Title")
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"title": "Updated Title"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    def test_update_multiple_fields(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(
            title="New", body="New body", mood_category="happy", mood_specific="proud"
        )
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={
                "title": "New",
                "body": "New body",
                "mood_category": "happy",
                "mood_specific": "proud",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New"
        assert data["body"] == "New body"
        assert data["mood_category"] == "happy"
        assert data["mood_specific"] == "proud"

    def test_update_journal_id(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        new_journal = "00000000-0000-0000-0000-000000000020"
        row = make_entry_row(journal_id=new_journal)
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"journal_id": new_journal},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["journal_id"] == new_journal

    def test_update_not_found(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.update.return_value = None

        response = client.patch(
            f"{ENTRIES_URL}/{uuid.uuid4()}",
            json={"title": "Nope"},
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_update_empty_body_rejected(self, client: TestClient) -> None:
        response = client.patch(
            f"{ENTRIES_URL}/{uuid.uuid4()}",
            json={},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_update_requires_auth(self, client: TestClient) -> None:
        response = client.patch(
            f"{ENTRIES_URL}/{uuid.uuid4()}",
            json={"title": "test"},
        )
        assert response.status_code in (401, 403)


SEARCH_URL = f"{ENTRIES_URL}/search"


class TestSearchEntries:
    def test_search_returns_results(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        rows = [make_entry_row(title="Morning walk", body="Walked in the park")]
        mock_journal_service.search.return_value = (rows, False)

        response = client.get(
            SEARCH_URL,
            params={"q": "morning"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == "Morning walk"
        assert data["has_more"] is False
        mock_journal_service.search.assert_called_once()

    def test_search_empty_results(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.search.return_value = ([], False)

        response = client.get(
            SEARCH_URL,
            params={"q": "nonexistent"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["has_more"] is False

    def test_search_with_pagination(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        now = datetime.now(UTC)
        rows = [
            make_entry_row(body=f"Result {i}", created_at=now - timedelta(hours=i))
            for i in range(2)
        ]
        mock_journal_service.search.return_value = (rows, True)

        response = client.get(
            SEARCH_URL,
            params={"q": "result", "limit": 2},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["has_more"] is True
        assert data["next_cursor"] is not None

    def test_search_empty_query_rejected(self, client: TestClient) -> None:
        response = client.get(
            SEARCH_URL,
            params={"q": ""},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_search_missing_query_rejected(self, client: TestClient) -> None:
        response = client.get(
            SEARCH_URL,
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_search_whitespace_only_rejected(self, client: TestClient) -> None:
        response = client.get(
            SEARCH_URL,
            params={"q": "   "},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_search_filtered_by_journal(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        journal_uuid = uuid.UUID(JID)
        rows = [make_entry_row(journal_id=JID, body="Filtered result")]
        mock_journal_service.search.return_value = (rows, False)

        response = client.get(
            SEARCH_URL,
            params={"q": "filtered", "journal_id": JID},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        call_args = mock_journal_service.search.call_args
        assert call_args.kwargs["journal_id"] == journal_uuid

    def test_search_requires_auth(self, client: TestClient) -> None:
        response = client.get(SEARCH_URL, params={"q": "test"})
        assert response.status_code in (401, 403)


class TestPinEntry:
    def test_create_pinned(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(body="Pinned entry", is_pinned=True)
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "Pinned entry", "is_pinned": True},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        assert response.json()["is_pinned"] is True

    def test_create_defaults_unpinned(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(body="Normal entry", is_pinned=False)
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "Normal entry"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        assert response.json()["is_pinned"] is False

    def test_pin_via_update(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(is_pinned=True)
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"is_pinned": True},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["is_pinned"] is True

    def test_unpin_via_update(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(is_pinned=False)
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"is_pinned": False},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["is_pinned"] is False

    def test_pinned_entries_in_list_response(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        now = datetime.now(UTC)
        rows = [
            make_entry_row(
                body="Pinned",
                is_pinned=True,
                created_at=now - timedelta(hours=2),
            ),
            make_entry_row(
                body="Recent unpinned",
                is_pinned=False,
                created_at=now,
            ),
        ]
        mock_journal_service.list_entries.return_value = (rows, False)

        response = client.get(ENTRIES_URL, headers=_auth_headers())

        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) == 2
        assert items[0]["is_pinned"] is True
        assert items[1]["is_pinned"] is False


class TestBackdateEntry:
    def test_create_with_custom_date(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        past = datetime(2025, 1, 15, 10, 30, tzinfo=UTC)
        row = make_entry_row(body="Backdated", created_at=past)
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "Backdated", "created_at": past.isoformat()},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        assert response.json()["created_at"] == "2025-01-15T10:30:00Z"

    def test_create_without_date_defaults(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row(body="Normal")
        mock_journal_service.create.return_value = row

        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "Normal"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        assert "created_at" in response.json()

    def test_create_future_date_rejected(self, client: TestClient) -> None:
        future = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        response = client.post(
            ENTRIES_URL,
            json={"journal_id": JID, "body": "test", "created_at": future},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_update_date(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        past = datetime(2025, 6, 1, 12, 0, tzinfo=UTC)
        row = make_entry_row(created_at=past)
        mock_journal_service.update.return_value = row

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"created_at": past.isoformat()},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["created_at"] == "2025-06-01T12:00:00Z"

    def test_update_future_date_rejected(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        row = make_entry_row()
        future = (datetime.now(UTC) + timedelta(hours=1)).isoformat()

        response = client.patch(
            f"{ENTRIES_URL}/{row.id}",
            json={"created_at": future},
            headers=_auth_headers(),
        )
        assert response.status_code == 422


class TestDeleteEntry:
    def test_delete_existing(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.soft_delete.return_value = True
        entry_id = uuid.uuid4()

        response = client.delete(
            f"{ENTRIES_URL}/{entry_id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 204
        mock_journal_service.soft_delete.assert_called_once()

    def test_delete_not_found(
        self, client: TestClient, mock_journal_service: AsyncMock
    ) -> None:
        mock_journal_service.soft_delete.return_value = False

        response = client.delete(
            f"{ENTRIES_URL}/{uuid.uuid4()}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_delete_requires_auth(self, client: TestClient) -> None:
        response = client.delete(f"{ENTRIES_URL}/{uuid.uuid4()}")
        assert response.status_code in (401, 403)
