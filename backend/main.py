import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import Base, engine, get_db
from backend.exceptions import (
    AudioTooLargeError,
    ConfigurationError,
    DuplicateLedgerError,
    ExtractionError,
    TranscriptionError,
    TranscriptTooLargeError,
)
from backend.routers import ledger, notes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("middaymeal.api")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context: Ensure database tables are created on startup."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="Midday Meal Ledger API",
    version="1.0.0",
    description="Stateless backend API for voice-driven school meal ledger management.",
    lifespan=lifespan,
)

# CORS: Browsers reject wildcard origins with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Global Domain Exception Handlers ---

@app.exception_handler(AudioTooLargeError)
async def handle_audio_too_large(request: Request, exc: AudioTooLargeError):
    logger.warning("AudioTooLargeError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "AudioTooLargeError", "detail": str(exc)},
    )


@app.exception_handler(TranscriptTooLargeError)
async def handle_transcript_too_large(request: Request, exc: TranscriptTooLargeError):
    logger.warning("TranscriptTooLargeError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "TranscriptTooLargeError", "detail": str(exc)},
    )


@app.exception_handler(TranscriptionError)
async def handle_transcription_error(request: Request, exc: TranscriptionError):
    logger.error("TranscriptionError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"error": "TranscriptionError", "detail": str(exc)},
    )


@app.exception_handler(ExtractionError)
async def handle_extraction_error(request: Request, exc: ExtractionError):
    logger.error("ExtractionError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"error": "ExtractionError", "detail": str(exc)},
    )


@app.exception_handler(DuplicateLedgerError)
async def handle_duplicate_ledger(request: Request, exc: DuplicateLedgerError):
    logger.warning("DuplicateLedgerError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": "DuplicateLedgerError", "detail": str(exc)},
    )


@app.exception_handler(ConfigurationError)
async def handle_configuration_error(request: Request, exc: ConfigurationError):
    logger.critical("ConfigurationError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "ConfigurationError", "detail": str(exc)},
    )


# Mount routers
app.include_router(ledger.router, prefix="/api/ledger", tags=["Ledger"])
app.include_router(notes.router, prefix="/api/notes", tags=["Admin Notes"])


@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check verifying database connectivity via SELECT 1 probe."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "version": "1.0.0",
        }
    except Exception as e:
        logger.error("Database health check probe failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {e}"
        )

