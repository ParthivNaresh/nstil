import uuid
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from tests.factories import DEFAULT_USER_ID, make_space_row, make_token

JOURNALS_URL = "/api/v1/journals"


def _auth_headers(sub: str = DEFAULT_USER_ID) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(sub=sub)}"}


class TestCreateJournal:
    def test_create_minimal(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        row = make_space_row(name="Work Stress")
        mock_space_service.create.return_value = row

        response = client.post(
            JOURNALS_URL,
            json={"name": "Work Stress"},
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Work Stress"
        assert data["id"] == str(row.id)
        assert data["user_id"] == DEFAULT_USER_ID
        mock_space_service.create.assert_called_once()

    def test_create_all_fields(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        row = make_space_row(
            name="Dreams",
            description="Nightly dreams",
            color="#FF6B6B",
            icon="moon",
        )
        mock_space_service.create.return_value = row

        response = client.post(
            JOURNALS_URL,
            json={
                "name": "Dreams",
                "description": "Nightly dreams",
                "color": "#FF6B6B",
                "icon": "moon",
            },
            headers=_auth_headers(),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Dreams"
        assert data["description"] == "Nightly dreams"
        assert data["color"] == "#FF6B6B"
        assert data["icon"] == "moon"

    def test_create_empty_name_rejected(self, client: TestClient) -> None:
        response = client.post(
            JOURNALS_URL,
            json={"name": ""},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_missing_name_rejected(self, client: TestClient) -> None:
        response = client.post(
            JOURNALS_URL,
            json={"description": "No name"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_name_too_long_rejected(self, client: TestClient) -> None:
        response = client.post(
            JOURNALS_URL,
            json={"name": "x" * 101},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_invalid_color_rejected(self, client: TestClient) -> None:
        response = client.post(
            JOURNALS_URL,
            json={"name": "Work", "color": "red"},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_create_requires_auth(self, client: TestClient) -> None:
        response = client.post(JOURNALS_URL, json={"name": "Work"})
        assert response.status_code in (401, 403)

    def test_create_passes_user_id_from_token(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        custom_user = "11111111-1111-1111-1111-111111111111"
        row = make_space_row(user_id=custom_user, name="Personal")
        mock_space_service.create.return_value = row

        response = client.post(
            JOURNALS_URL,
            json={"name": "Personal"},
            headers=_auth_headers(sub=custom_user),
        )

        assert response.status_code == 201
        call_args = mock_space_service.create.call_args
        assert str(call_args[0][0]) == custom_user


class TestListJournals:
    def test_list_empty(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        mock_space_service.list_spaces.return_value = []

        response = client.get(JOURNALS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_list_with_journals(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        rows = [
            make_space_row(name="My Journal", sort_order=0),
            make_space_row(name="Work", sort_order=1),
            make_space_row(name="Dreams", sort_order=2),
        ]
        mock_space_service.list_spaces.return_value = rows

        response = client.get(JOURNALS_URL, headers=_auth_headers())

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["items"][0]["name"] == "My Journal"
        assert data["items"][1]["name"] == "Work"
        assert data["items"][2]["name"] == "Dreams"

    def test_list_requires_auth(self, client: TestClient) -> None:
        response = client.get(JOURNALS_URL)
        assert response.status_code in (401, 403)


class TestGetJournal:
    def test_get_existing(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        row = make_space_row(name="Work", color="#FF0000")
        mock_space_service.get_by_id.return_value = row

        response = client.get(
            f"{JOURNALS_URL}/{row.id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(row.id)
        assert data["name"] == "Work"
        assert data["color"] == "#FF0000"

    def test_get_not_found(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        mock_space_service.get_by_id.return_value = None

        response = client.get(
            f"{JOURNALS_URL}/{uuid.uuid4()}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_get_requires_auth(self, client: TestClient) -> None:
        response = client.get(f"{JOURNALS_URL}/{uuid.uuid4()}")
        assert response.status_code in (401, 403)


class TestUpdateJournal:
    def test_update_name(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        row = make_space_row(name="Updated Name")
        mock_space_service.update.return_value = row

        response = client.patch(
            f"{JOURNALS_URL}/{row.id}",
            json={"name": "Updated Name"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    def test_update_multiple_fields(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        row = make_space_row(
            name="New Name",
            color="#00FF00",
            icon="star",
        )
        mock_space_service.update.return_value = row

        response = client.patch(
            f"{JOURNALS_URL}/{row.id}",
            json={"name": "New Name", "color": "#00FF00", "icon": "star"},
            headers=_auth_headers(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["color"] == "#00FF00"
        assert data["icon"] == "star"

    def test_update_not_found(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        mock_space_service.update.return_value = None

        response = client.patch(
            f"{JOURNALS_URL}/{uuid.uuid4()}",
            json={"name": "Nope"},
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_update_empty_body_rejected(self, client: TestClient) -> None:
        response = client.patch(
            f"{JOURNALS_URL}/{uuid.uuid4()}",
            json={},
            headers=_auth_headers(),
        )
        assert response.status_code == 422

    def test_update_requires_auth(self, client: TestClient) -> None:
        response = client.patch(
            f"{JOURNALS_URL}/{uuid.uuid4()}",
            json={"name": "test"},
        )
        assert response.status_code in (401, 403)


class TestDeleteJournal:
    def test_delete_existing(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        mock_space_service.soft_delete.return_value = True
        journal_id = uuid.uuid4()

        response = client.delete(
            f"{JOURNALS_URL}/{journal_id}",
            headers=_auth_headers(),
        )

        assert response.status_code == 204
        mock_space_service.soft_delete.assert_called_once()

    def test_delete_not_found(
        self, client: TestClient, mock_space_service: AsyncMock
    ) -> None:
        mock_space_service.soft_delete.return_value = False

        response = client.delete(
            f"{JOURNALS_URL}/{uuid.uuid4()}",
            headers=_auth_headers(),
        )

        assert response.status_code == 404

    def test_delete_requires_auth(self, client: TestClient) -> None:
        response = client.delete(f"{JOURNALS_URL}/{uuid.uuid4()}")
        assert response.status_code in (401, 403)
