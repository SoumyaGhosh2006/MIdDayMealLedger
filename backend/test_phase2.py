import io
import json
import logging
import os
import sys
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

# Ensure project root directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq import APIConnectionError, APITimeoutError, AuthenticationError

from backend.config import Settings, settings
from backend.exceptions import (
    ConfigurationError,
    ExtractionError,
    MiddayMealError,
    TranscriptionError,
)
from backend.schemas import LedgerCreate
from backend.services.audio_service import (
    MAX_AUDIO_SIZE_BYTES,
    get_groq_client as get_audio_groq_client,
    transcribe_audio,
)
from backend.services.llm_service import (
    MAX_TRANSCRIPT_LENGTH,
    build_system_prompt,
    extract_ledger_from_text,
    get_groq_client as get_llm_groq_client,
)


def test_config_initialization():
    print("-> Testing Centralized Configuration (Settings)...")
    assert hasattr(settings, "DATABASE_URL")
    assert hasattr(settings, "GROQ_API_KEY")
    assert hasattr(settings, "GROQ_LLM_MODEL")
    assert hasattr(settings, "SQL_ECHO")
    print("   [PASS] Settings class and attributes initialized successfully.")


def test_audio_service_size_guard():
    print("-> Testing Audio Service 25MB Size Guard...")
    oversized_data = b"0" * (MAX_AUDIO_SIZE_BYTES + 1)
    try:
        transcribe_audio(oversized_data)
        assert False, "Should have raised TranscriptionError for oversized audio bytes"
    except TranscriptionError as e:
        assert "exceeds maximum limit of 25MB" in str(e)
        print("   [PASS] 25MB audio size guard properly enforced.")


def test_audio_service_missing_config():
    print("-> Testing Audio Service missing GROQ_API_KEY error...")
    with patch.object(settings, "GROQ_API_KEY", ""):
        try:
            get_audio_groq_client()
            assert False, "Should have raised ConfigurationError when GROQ_API_KEY is empty"
        except ConfigurationError as e:
            assert "GROQ_API_KEY is not configured" in str(e)
            print("   [PASS] ConfigurationError raised when API key is missing.")


def test_audio_service_transcription_with_client_timeout():
    print("-> Testing Audio Service Groq client initialization and transcription...")
    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key_123"):
        with patch("backend.services.audio_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client

            mock_response = MagicMock()
            mock_response.text = "Today is July 2nd. Menu is Mixveg and Dal."
            mock_client.audio.transcriptions.create.return_value = mock_response

            client = get_audio_groq_client()
            MockGroqClass.assert_called_with(api_key="gsk_test_key_123", timeout=30.0)

            result = transcribe_audio(b"fake audio data", filename="test.m4a")
            assert result == "Today is July 2nd. Menu is Mixveg and Dal."
            print("   [PASS] Audio transcription completed with client timeout=30.0.")


def test_groq_specific_exceptions_mapping():
    print("-> Testing specific Groq exceptions (Authentication, Timeout, Connection)...")
    mock_request = MagicMock()

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key_123"):
        # 1. Test AuthenticationError in LLM service
        with patch("backend.services.llm_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client
            mock_client.chat.completions.create.side_effect = AuthenticationError(
                message="Invalid API Key", response=MagicMock(status_code=401), body=None
            )
            try:
                extract_ledger_from_text("sample transcript")
                assert False, "Should have raised ExtractionError on AuthenticationError"
            except ExtractionError as e:
                assert "Groq authentication failed" in str(e)

        # 2. Test APITimeoutError in Audio service
        with patch("backend.services.audio_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client
            mock_client.audio.transcriptions.create.side_effect = APITimeoutError(request=mock_request)
            try:
                transcribe_audio(b"sample bytes")
                assert False, "Should have raised TranscriptionError on APITimeoutError"
            except TranscriptionError as e:
                assert "timed out" in str(e)

        # 3. Test APIConnectionError in LLM service
        with patch("backend.services.llm_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client
            mock_client.chat.completions.create.side_effect = APIConnectionError(request=mock_request)
            try:
                extract_ledger_from_text("sample transcript")
                assert False, "Should have raised ExtractionError on APIConnectionError"
            except ExtractionError as e:
                assert "Failed to connect to Groq API" in str(e)

    print("   [PASS] Specific Groq exceptions mapped cleanly to domain errors.")


def test_llm_service_size_guard():
    print("-> Testing LLM Service 10,000-character Size Guard...")
    oversized_transcript = "A" * (MAX_TRANSCRIPT_LENGTH + 1)
    try:
        extract_ledger_from_text(oversized_transcript)
        assert False, "Should have raised ExtractionError for oversized transcript"
    except ExtractionError as e:
        assert "exceeds maximum allowed length of 10000 characters" in str(e)
        print("   [PASS] 10,000 character transcript guard properly enforced.")


def test_system_prompt_date_instruction():
    print("-> Testing System Prompt Date Instruction...")
    target_date = date(2026, 7, 2)
    prompt = build_system_prompt(target_date)
    assert "If no date is spoken, you MUST strictly use the Current Reference Date." in prompt
    assert "Current Reference Date: 2026-07-02" in prompt
    print("   [PASS] Strict Current Reference Date instruction confirmed in prompt.")


def test_llm_service_extraction_success():
    print("-> Testing LLM Service extraction and Pydantic validation...")
    valid_llm_output = {
        "date": "2026-07-02",
        "egg": "90.00",
        "oil": "220.00",
        "dal": "150.50",
        "soya_potato": "80.00",
        "masala": "35.00",
        "grocery": "50.00",
        "veg": "120.00",
        "fuel": "75.00",
        "opening_balance_rice": "100.00",
        "daily_count": 145,
        "closing_balance_rice": "81.50",
        "class_5": 31,
        "class_6": 48,
        "class_7": 42,
        "class_8": 39,
        "menu": "Mixveg, Soya, and Dal"
    }

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key_123"):
        with patch("backend.services.llm_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client

            mock_completion = MagicMock()
            mock_choice = MagicMock()
            mock_choice.message.content = json.dumps(valid_llm_output)
            mock_completion.choices = [mock_choice]
            mock_client.chat.completions.create.return_value = mock_completion

            ledger = extract_ledger_from_text(
                "Today is July 2nd. Menu is Mixveg, Soya, and Dal...",
                reference_date=date(2026, 7, 2)
            )

            MockGroqClass.assert_called_with(api_key="gsk_test_key_123", timeout=30.0)

            assert ledger.date == date(2026, 7, 2)
            assert ledger.total_expense == Decimal("820.50")
            assert ledger.daily_count == 145
            assert ledger.total_attendance == 160
            assert ledger.menu == "Mixveg, Soya, and Dal"
            print("   [PASS] Extraction parsed and validated into LedgerCreate.")


def test_llm_service_repair_loop_logging():
    print("-> Testing LLM Service 1-turn repair loop and privacy logging...")
    invalid_first_output = "{\"date\": \"not-a-valid-date\"}"
    valid_second_output = {
        "date": "2026-07-02",
        "egg": "50.00",
        "menu": "Dal and Rice"
    }

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key_123"):
        with patch("backend.services.llm_service.Groq") as MockGroqClass:
            mock_client = MagicMock()
            MockGroqClass.return_value = mock_client

            mock_completion_1 = MagicMock()
            mock_choice_1 = MagicMock()
            mock_choice_1.message.content = invalid_first_output
            mock_completion_1.choices = [mock_choice_1]

            mock_completion_2 = MagicMock()
            mock_choice_2 = MagicMock()
            mock_choice_2.message.content = json.dumps(valid_second_output)
            mock_completion_2.choices = [mock_choice_2]

            mock_client.chat.completions.create.side_effect = [
                mock_completion_1,
                mock_completion_2
            ]

            with patch("backend.services.llm_service.logger.warning") as mock_logger_warning, \
                 patch("backend.services.llm_service.logger.debug") as mock_logger_debug:
                ledger = extract_ledger_from_text(
                    "Transcript triggering repair...",
                    reference_date=date(2026, 7, 2)
                )

                assert mock_logger_warning.called, "Expected logger.warning to be called during repair loop"
                warning_msg = mock_logger_warning.call_args[0][0]
                assert "LLM extraction schema validation failed:" in warning_msg
                assert "Initiating 1-turn repair loop" in warning_msg
                assert mock_logger_debug.called, "Expected raw dump to be routed to logger.debug"
                assert ledger.date == date(2026, 7, 2)
                assert ledger.egg == Decimal("50.00")
                print("   [PASS] Privacy-preserving warning and debug logging verified.")


def test_live_groq_integration():
    print("-> Testing Live Groq Integration (Real API Call)...")
    real_key = settings.GROQ_API_KEY
    if not real_key or not real_key.startswith("gsk_"):
        print("   [SKIPPED] Live Groq integration skipped (no GROQ_API_KEY found in environment).")
        return

    sample_text = "Today is July 2nd 2026. Egg was 90, oil 220, dal 150. Menu is egg dal."
    target_date = date(2026, 7, 2)

    ledger = extract_ledger_from_text(sample_text, reference_date=target_date)
    assert ledger.date == target_date
    assert ledger.egg == Decimal("90.00")
    assert ledger.oil == Decimal("220.00")
    assert ledger.dal == Decimal("150.00")
    assert ledger.total_expense == Decimal("460.00")
    print(f"   [PASS] Live Groq call succeeded! Extracted {ledger.menu}, total expense: {ledger.total_expense}")


if __name__ == "__main__":
    print("=== Running Phase 2 Core AI Services Verification Suite ===")
    test_config_initialization()
    test_audio_service_size_guard()
    test_audio_service_missing_config()
    test_audio_service_transcription_with_client_timeout()
    test_groq_specific_exceptions_mapping()
    test_llm_service_size_guard()
    test_system_prompt_date_instruction()
    test_llm_service_extraction_success()
    test_llm_service_repair_loop_logging()
    test_live_groq_integration()
    print("=== All Phase 2 Tests Passed Successfully! ===")
