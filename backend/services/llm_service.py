import json
import logging
from datetime import date
from typing import Optional
from groq import APIConnectionError, APITimeoutError, AuthenticationError, Groq
from pydantic import ValidationError

from backend.config import settings
from backend.exceptions import ConfigurationError, ExtractionError
from backend.schemas import LedgerCreate

logger = logging.getLogger(__name__)

MAX_TRANSCRIPT_LENGTH = 10000


def get_groq_client() -> Groq:
    """Instantiate Groq client with timeout at the client level."""
    if not settings.GROQ_API_KEY:
        raise ConfigurationError("GROQ_API_KEY is not configured in settings or environment.")
    return Groq(api_key=settings.GROQ_API_KEY, timeout=30.0)


def build_system_prompt(target_date: Optional[date] = None) -> str:
    schema_json = json.dumps(LedgerCreate.model_json_schema(), indent=2)
    reference_date_str = (target_date or date.today()).isoformat()

    return f"""You are a specialized Midday Meal Ledger extraction assistant for Indian government schools.
Your task is to parse spoken voice transcription into a single, valid JSON object matching the JSON schema below.

Current Reference Date: {reference_date_str}

### EXTRACTION RULES:
1. "date": Extract the date spoken. Format strictly as "YYYY-MM-DD". If only day and month are spoken (e.g. "July 2nd"), assume year from Current Reference Date ({reference_date_str[:4]}). If no date is spoken, you MUST strictly use the Current Reference Date.
2. Expenses: Extract numeric costs for egg, oil, dal, soya_potato, masala, grocery, veg, fuel. If an item was not mentioned, set its value to 0.00.
3. Inventory: 
   - "opening_balance_rice": Opening stock in kg (Decimal), or null if not spoken.
   - "daily_count": Total student headcount who received meal today (Integer), or null if not spoken.
   - "closing_balance_rice": Closing stock in kg (Decimal), or null if not spoken.
4. Attendance: Extract headcount for class_5, class_6, class_7, and class_8 (Integers). If unmentioned, set to 0.
5. Menu: Concise summary of items served (e.g. "Mixveg, Soya, and Dal").
6. Computed Totals: You do NOT need to compute totals (total_expense, total_attendance_6_8, total_attendance). The system computes them automatically.
7. Return ONLY valid JSON matching the schema. No markdown formatting, no explanatory text.

### TARGET JSON SCHEMA:
{schema_json}
"""


def extract_ledger_from_text(
    transcribed_text: str,
    reference_date: Optional[date] = None,
    model: Optional[str] = None
) -> LedgerCreate:
    """
    Extracts structured Midday Meal ledger data from text using Groq Llama 3 with JSON mode.
    Validates output through Pydantic LedgerCreate schema with 10k character size guard,
    client-level timeout, and a logged 1-turn repair loop.
    """
    if len(transcribed_text) > MAX_TRANSCRIPT_LENGTH:
        raise ExtractionError(
            f"Transcript exceeds maximum allowed length of {MAX_TRANSCRIPT_LENGTH} characters "
            f"(received {len(transcribed_text)} characters)."
        )

    client = get_groq_client()
    target_model = model or settings.GROQ_LLM_MODEL
    system_prompt = build_system_prompt(reference_date)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Extract ledger data from this transcription:\n\n{transcribed_text}"}
    ]

    try:
        response = client.chat.completions.create(
            model=target_model,
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
    except AuthenticationError as e:
        raise ExtractionError(f"Groq authentication failed (invalid API key): {e}") from e
    except APITimeoutError as e:
        raise ExtractionError(f"Groq request timed out (timeout=30.0s): {e}") from e
    except APIConnectionError as e:
        raise ExtractionError(f"Failed to connect to Groq API: {e}") from e
    except Exception as e:
        raise ExtractionError(f"Groq LLM extraction API call failed: {e}") from e

    raw_json_str = response.choices[0].message.content or "{}"

    try:
        return LedgerCreate.model_validate_json(raw_json_str)
    except (ValidationError, json.JSONDecodeError) as err:
        repair_user_content = (
            f"Your previous output was invalid JSON or violated the schema. "
            f"Validation error: {err}. Return the corrected JSON only."
        )

        logger.warning(
            "LLM extraction schema validation failed: %s. Initiating 1-turn repair loop.",
            err
        )
        logger.debug(
            "Original invalid output: %s. Repair prompt: %s",
            raw_json_str,
            repair_user_content
        )

        repair_messages = list(messages)
        repair_messages.append({"role": "assistant", "content": raw_json_str})
        repair_messages.append({"role": "user", "content": repair_user_content})

        try:
            retry_response = client.chat.completions.create(
                model=target_model,
                messages=repair_messages,
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            retry_json_str = retry_response.choices[0].message.content or "{}"
            return LedgerCreate.model_validate_json(retry_json_str)
        except AuthenticationError as e:
            raise ExtractionError(f"Groq authentication failed during repair: {e}") from e
        except APITimeoutError as e:
            raise ExtractionError(f"Groq request timed out during repair: {e}") from e
        except APIConnectionError as e:
            raise ExtractionError(f"Failed to connect to Groq API during repair: {e}") from e
        except Exception as retry_err:
            raise ExtractionError(
                f"LLM extraction repair failed to yield valid LedgerCreate JSON: {retry_err}"
            ) from retry_err
