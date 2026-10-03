import os
from typing import BinaryIO, Union
from groq import APIConnectionError, APITimeoutError, AuthenticationError, Groq

from backend.config import settings
from backend.exceptions import ConfigurationError, TranscriptionError

MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

WHISPER_MDM_PROMPT = (
    "Midday meal school ledger: Date, egg, oil, dal, soya, potato, masala, "
    "grocery, veg, fuel, rice opening balance, daily count, closing balance, "
    "Class V, Class VI, Class VII, Class VIII attendance, menu."
)


def get_groq_client() -> Groq:
    """Instantiate Groq client with timeout at the client level."""
    if not settings.GROQ_API_KEY:
        raise ConfigurationError("GROQ_API_KEY is not configured in settings or environment.")
    return Groq(api_key=settings.GROQ_API_KEY, timeout=30.0)


def transcribe_audio(
    audio_file: Union[str, bytes, BinaryIO],
    filename: str = "recording.m4a"
) -> str:
    """
    Transcribes audio using Groq's whisper-large-v3 model with 25MB size guard,
    domain vocabulary biasing, and client-level timeout.
    """
    if isinstance(audio_file, str):
        if not os.path.exists(audio_file):
            raise TranscriptionError(f"Audio file not found: {audio_file}")
        file_size = os.path.getsize(audio_file)
        if file_size > MAX_AUDIO_SIZE_BYTES:
            raise TranscriptionError(f"Audio file size ({file_size} bytes) exceeds maximum limit of 25MB.")
        with open(audio_file, "rb") as f:
            file_bytes = f.read()
        payload = (os.path.basename(audio_file), file_bytes)

    elif isinstance(audio_file, bytes):
        if len(audio_file) > MAX_AUDIO_SIZE_BYTES:
            raise TranscriptionError(f"Audio byte size ({len(audio_file)} bytes) exceeds maximum limit of 25MB.")
        payload = (filename, audio_file)

    elif hasattr(audio_file, "read"):
        file_bytes = audio_file.read()
        if len(file_bytes) > MAX_AUDIO_SIZE_BYTES:
            raise TranscriptionError(f"Audio stream size ({len(file_bytes)} bytes) exceeds maximum limit of 25MB.")
        payload = (filename, file_bytes)

    else:
        raise TranscriptionError("Unsupported audio file format. Must be str path, bytes, or file-like object.")

    client = get_groq_client()

    try:
        transcription = client.audio.transcriptions.create(
            file=payload,
            model="whisper-large-v3",
            response_format="json",
            prompt=WHISPER_MDM_PROMPT,
            temperature=0.0
        )
        return transcription.text.strip()
    except AuthenticationError as e:
        raise TranscriptionError(f"Groq authentication failed (invalid API key): {e}") from e
    except APITimeoutError as e:
        raise TranscriptionError(f"Groq transcription request timed out (timeout=30.0s): {e}") from e
    except APIConnectionError as e:
        raise TranscriptionError(f"Failed to connect to Groq API: {e}") from e
    except Exception as e:
        raise TranscriptionError(f"Audio transcription failed: {e}") from e
