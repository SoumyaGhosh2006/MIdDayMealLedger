import io
import os
import sys
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

# Ensure project root directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.exceptions import (
    AudioTooLargeError,
    ExtractionError,
    TranscriptionError,
    TranscriptTooLargeError,
)
from backend.main import app
from backend.models import DailyLedger
from backend.schemas import LedgerCreate

# Configure isolated in-memory SQLite database with StaticPool for test session sharing
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


def test_health_check():
    print("-> Testing GET /health with database probe...")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    print("   [PASS] Health check verified with active database connectivity.")


def test_process_voice_success():
    print("-> Testing POST /api/ledger/process-voice success case...")
    fake_audio = io.BytesIO(b"fake audio data bytes")
    files = {"file": ("test.m4a", fake_audio, "audio/m4a")}
    data = {"reference_date": "2026-07-02"}

    mocked_ledger = LedgerCreate(
        date=date(2026, 7, 2),
        egg=Decimal("90.00"),
        oil=Decimal("220.00"),
        menu="Mixveg and Dal"
    )

    with patch("backend.routers.ledger.transcribe_audio") as mock_transcribe, \
         patch("backend.routers.ledger.extract_ledger_from_text") as mock_extract:
        mock_transcribe.return_value = "Today is July 2nd. Egg was 90, oil 220."
        mock_extract.return_value = mocked_ledger

        response = client.post("/api/ledger/process-voice", files=files, data=data)
        assert response.status_code == 200
        res_json = response.json()
        assert res_json["transcription"] == "Today is July 2nd. Egg was 90, oil 220."
        assert res_json["data"]["date"] == "2026-07-02"
        assert res_json["data"]["egg"] == "90.00"
        assert res_json["data"]["oil"] == "220.00"
        assert res_json["data"]["total_expense"] == "310.00"
        print("   [PASS] Voice processing returned ProcessVoiceResponse with transcript and LedgerCreate.")


def test_process_voice_with_codec_parameters():
    print("-> Testing POST /api/ledger/process-voice with complex MIME type (audio/webm;codecs=opus)...")
    fake_audio = io.BytesIO(b"fake audio data bytes")
    files = {"file": ("recording.webm", fake_audio, "audio/webm;codecs=opus")}

    mocked_ledger = LedgerCreate(
        date=date(2026, 7, 2),
        egg=Decimal("90.00"),
        oil=Decimal("220.00")
    )

    with patch("backend.routers.ledger.transcribe_audio") as mock_transcribe, \
         patch("backend.routers.ledger.extract_ledger_from_text") as mock_extract:
        mock_transcribe.return_value = "Today is July 2nd. Egg was 90, oil 220."
        mock_extract.return_value = mocked_ledger

        response = client.post("/api/ledger/process-voice", files=files)
        assert response.status_code == 200
        print("   [PASS] Complex MIME type audio/webm;codecs=opus successfully accepted.")



def test_process_voice_unsupported_media_type():
    print("-> Testing POST /api/ledger/process-voice with 415 Unsupported Media Type...")
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake pdf")
    files = {"file": ("report.pdf", fake_pdf, "application/pdf")}

    response = client.post("/api/ledger/process-voice", files=files)
    assert response.status_code == 415
    assert "Unsupported audio type" in response.json()["detail"]
    print("   [PASS] 415 Unsupported Media Type returned for non-audio upload.")


def test_process_voice_audio_too_large():
    print("-> Testing POST /api/ledger/process-voice with AudioTooLargeError (400)...")
    fake_audio = io.BytesIO(b"large audio")
    files = {"file": ("large.webm", fake_audio, "audio/webm")}

    with patch("backend.routers.ledger.transcribe_audio") as mock_transcribe:
        mock_transcribe.side_effect = AudioTooLargeError("Audio file exceeds maximum limit of 25MB.")
        response = client.post("/api/ledger/process-voice", files=files)
        assert response.status_code == 400
        assert response.json()["error"] == "AudioTooLargeError"
        print("   [PASS] AudioTooLargeError mapped cleanly to 400 Bad Request.")


def test_process_voice_transcript_too_large():
    print("-> Testing POST /api/ledger/process-voice with TranscriptTooLargeError (400)...")
    fake_audio = io.BytesIO(b"valid audio")
    files = {"file": ("test.wav", fake_audio, "audio/wav")}

    with patch("backend.routers.ledger.transcribe_audio") as mock_transcribe, \
         patch("backend.routers.ledger.extract_ledger_from_text") as mock_extract:
        mock_transcribe.return_value = "Extremely long text..."
        mock_extract.side_effect = TranscriptTooLargeError("Transcript exceeds maximum allowed length.")

        response = client.post("/api/ledger/process-voice", files=files)
        assert response.status_code == 400
        assert response.json()["error"] == "TranscriptTooLargeError"
        print("   [PASS] TranscriptTooLargeError mapped cleanly to 400 Bad Request.")


def test_process_voice_upstream_failure():
    print("-> Testing POST /api/ledger/process-voice with TranscriptionError (502)...")
    fake_audio = io.BytesIO(b"valid audio")
    files = {"file": ("test.wav", fake_audio, "audio/wav")}

    with patch("backend.routers.ledger.transcribe_audio") as mock_transcribe:
        mock_transcribe.side_effect = TranscriptionError("Failed to connect to Groq API")

        response = client.post("/api/ledger/process-voice", files=files)
        assert response.status_code == 502
        assert response.json()["error"] == "TranscriptionError"
        print("   [PASS] Upstream TranscriptionError mapped cleanly to 502 Bad Gateway.")


def test_ledger_crud_and_duplicate_conflict():
    print("-> Testing POST /api/ledger/ and 409 DuplicateLedgerError...")
    payload_1 = {
        "date": "2026-07-10",
        "egg": "80.00",
        "oil": "150.00",
        "menu": "Egg curry"
    }

    # First insertion -> 201 Created
    res1 = client.post("/api/ledger/", json=payload_1)
    assert res1.status_code == 201
    created_entry = res1.json()
    assert created_entry["id"] is not None
    assert created_entry["total_expense"] == "230.00"
    print("   [PASS] New ledger entry created with 201 Created.")

    # Duplicate insertion for same date -> 409 Conflict
    res2 = client.post("/api/ledger/", json=payload_1)
    assert res2.status_code == 409
    assert res2.json()["error"] == "DuplicateLedgerError"
    print("   [PASS] Duplicate date entry rejected with 409 Conflict.")


def test_ledger_get_and_date_validation():
    print("-> Testing GET /api/ledger/ with date validation and pagination...")
    # Add a second entry for pagination/sorting test
    payload_2 = {
        "date": "2026-07-11",
        "egg": "100.00",
        "oil": "200.00",
        "menu": "Vegetable Khichdi"
    }
    client.post("/api/ledger/", json=payload_2)

    # 1. Invalid date range (start_date > end_date) -> 400 Bad Request
    res_bad_dates = client.get("/api/ledger/?start_date=2026-07-15&end_date=2026-07-10")
    assert res_bad_dates.status_code == 400
    assert "start_date cannot be after end_date" in res_bad_dates.json()["detail"]
    print("   [PASS] Inverted date range correctly rejected with 400 Bad Request.")

    # 2. Valid date range query
    res_range = client.get("/api/ledger/?start_date=2026-07-10&end_date=2026-07-11")
    assert res_range.status_code == 200
    entries = res_range.json()
    assert len(entries) == 2
    assert entries[0]["date"] == "2026-07-10"
    assert entries[1]["date"] == "2026-07-11"
    print("   [PASS] Chronological date filtering verified.")

    # 3. Pagination (limit=1, offset=1)
    res_page = client.get("/api/ledger/?limit=1&offset=1")
    assert res_page.status_code == 200
    paged_entries = res_page.json()
    assert len(paged_entries) == 1
    assert paged_entries[0]["date"] == "2026-07-11"
    print("   [PASS] Limit and offset pagination verified.")


def test_extract_text_success():
    print("-> Testing POST /api/ledger/extract-text success case...")
    mocked_ledger = LedgerCreate(
        date=date(2026, 7, 5),
        egg=Decimal("120.00"),
        oil=Decimal("180.00"),
        menu="Rice and Egg"
    )
    with patch("backend.routers.ledger.extract_ledger_from_text") as mock_extract:
        mock_extract.return_value = mocked_ledger
        response = client.post(
            "/api/ledger/extract-text",
            json={"text": "Today is July 5th. Egg 120, oil 180.", "reference_date": "2026-07-05"}
        )
        assert response.status_code == 200
        res_json = response.json()
        assert res_json["date"] == "2026-07-05"
        assert res_json["egg"] == "120.00"
        assert res_json["oil"] == "180.00"
        assert res_json["total_expense"] == "300.00"
        print("   [PASS] Text-only extraction returned validated LedgerCreate JSON.")


if __name__ == "__main__":
    print("=== Running Phase 3 API Layer Verification Suite ===")
    test_health_check()
    test_process_voice_success()
    test_process_voice_with_codec_parameters()
    test_process_voice_unsupported_media_type()
    test_process_voice_audio_too_large()
    test_process_voice_transcript_too_large()
    test_process_voice_upstream_failure()
    test_extract_text_success()
    test_ledger_crud_and_duplicate_conflict()
    test_ledger_get_and_date_validation()
    print("=== All Phase 3 Tests Passed Successfully! ===")

