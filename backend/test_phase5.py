import io
import os
import sys
from unittest.mock import MagicMock, patch

# Ensure project root directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app

# Isolated in-memory database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_admin_notes_crud():
    print("=== Running Phase 5 Admin Notes Verification Suite ===")

    # 1. Create a note
    print("-> Testing POST /api/notes/ (Create Note)...")
    payload = {
        "date": "2026-10-04",
        "content": "BEO visited school. Inspected midday meal register and inventory."
    }
    response = client.post("/api/notes/", json=payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    created_note = response.json()
    assert created_note["id"] is not None
    assert created_note["date"] == "2026-10-04"
    assert "BEO visited" in created_note["content"]
    assert "created_at" in created_note
    note_id = created_note["id"]
    print("   [PASS] Created note successfully with ID:", note_id)

    # 2. Create another note
    print("-> Testing second note creation...")
    payload2 = {
        "date": "2026-10-02",
        "content": "Rice stock low. Urgent replenishment required from depot."
    }
    response2 = client.post("/api/notes/", json=payload2)
    assert response2.status_code == 201
    note2_id = response2.json()["id"]
    print("   [PASS] Created second note with ID:", note2_id)

    # 3. List notes
    print("-> Testing GET /api/notes/ (List Notes)...")
    res_list = client.get("/api/notes/")
    assert res_list.status_code == 200
    notes = res_list.json()
    assert len(notes) == 2
    assert notes[0]["date"] == "2026-10-04"
    print("   [PASS] Notes listed successfully and ordered descending.")

    # 4. Inverted date range
    print("-> Testing invalid date range (start > end)...")
    invalid_res = client.get("/api/notes/?start_date=2026-10-10&end_date=2026-10-05")
    assert invalid_res.status_code == 400
    print("   [PASS] Inverted date range rejected with 400 Bad Request.")

    # 5. Delete note
    print("-> Testing DELETE /api/notes/{id}...")
    del_res = client.delete(f"/api/notes/{note_id}")
    assert del_res.status_code == 200
    print("   [PASS] Note successfully deleted.")

    # 6. Test /generate-teaching-aid endpoint with mocked Groq
    print("-> Testing POST /api/notes/generate-teaching-aid...")
    mock_choice = MagicMock()
    mock_choice.message.content = '{"smart_filename": "Trigonometry_Teaching_Aid_Class10", "markdown_content": "# Trigonometry Class 10\\n## Formulas\\n- sin^2(x) + cos^2(x) = 1\\n## HOTS Questions\\n1. Explain...", "svg_diagrams": ["<svg viewBox=\\"0 0 100 100\\"><polygon points=\\"10,90 90,90 90,10\\" fill=\\"none\\" stroke=\\"black\\"/></svg>"]}'
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    with patch("backend.routers.notes.get_groq_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        mock_get_client.return_value = mock_client

        file_content = b"Trigonometry identities and right angled triangle definitions."
        file_obj = io.BytesIO(file_content)
        res_aid = client.post(
            "/api/notes/generate-teaching-aid",
            files={"file": ("test_doc.txt", file_obj, "text/plain")}
        )
        assert res_aid.status_code == 200, f"Expected 200, got {res_aid.status_code}: {res_aid.text}"
        data = res_aid.json()
        assert data["smart_filename"] == "Trigonometry_Teaching_Aid_Class10"
        assert "Trigonometry" in data["markdown_content"]
        assert len(data["svg_diagrams"]) == 1
        print("   [PASS] /generate-teaching-aid returned structured teaching aid successfully.")

    print("=== All Phase 5 Tests Passed Successfully! ===")


if __name__ == "__main__":
    test_admin_notes_crud()
