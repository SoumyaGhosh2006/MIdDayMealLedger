from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import LedgerCreate, LedgerResponse
from backend.services.audio_service import transcribe_audio
from backend.services.ledger_service import create_ledger_entry, list_ledger_entries
from backend.services.llm_service import extract_ledger_from_text

router = APIRouter()

SUPPORTED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
}


class ProcessVoiceResponse(BaseModel):
    """Wrapper response returning both raw audio transcript and structured ledger data."""
    transcription: str
    data: LedgerCreate


@router.post(
    "/process-voice",
    response_model=ProcessVoiceResponse,
    status_code=status.HTTP_200_OK,
    summary="Process voice recording into structured ledger data"
)
def process_voice_entry(
    file: UploadFile = File(..., description="Audio recording file (webm, m4a, wav, mp3)"),
    reference_date: Optional[date] = Form(None, description="Optional reference date (defaults to today)")
):
    """
    Synchronous orchestration endpoint:
    Runs in FastAPI's external threadpool to prevent blocking the event loop on synchronous Groq calls.
    1. Validates audio MIME type (raises 415 if unsupported)
    2. Reads audio stream synchronously
    3. Transcribes via Groq Whisper-large-v3
    4. Extracts structured ledger data via Groq LLM
    5. Returns both transcript and validated LedgerCreate for user confirmation
    """
    if file.content_type and file.content_type.lower() not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported audio type '{file.content_type}'. "
                f"Supported types: {', '.join(sorted(SUPPORTED_AUDIO_TYPES))}"
            )
        )

    # Read synchronously from the underlying SpooledTemporaryFile
    audio_bytes = file.file.read()
    transcription_text = transcribe_audio(audio_bytes, filename=file.filename or "recording.m4a")
    extracted_data = extract_ledger_from_text(transcription_text, reference_date=reference_date)

    return ProcessVoiceResponse(
        transcription=transcription_text,
        data=extracted_data
    )


@router.post(
    "/",
    response_model=LedgerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save validated daily ledger entry"
)
def create_ledger(
    ledger_in: LedgerCreate,
    db: Session = Depends(get_db)
):
    """Inserts a verified daily ledger entry into the persistent relational database."""
    return create_ledger_entry(db, ledger_in)


@router.get(
    "/",
    response_model=List[LedgerResponse],
    status_code=status.HTTP_200_OK,
    summary="List daily ledger entries with optional date filtering and pagination"
)
def get_ledgers(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=100, ge=1, le=500, description="Max entries to return"),
    offset: int = Query(default=0, ge=0, description="Number of entries to skip"),
    db: Session = Depends(get_db)
):
    """Retrieves continuous ledger history, optionally bounded by date range with pagination."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date."
        )

    return list_ledger_entries(
        db,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )

