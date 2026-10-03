"""Custom domain exceptions for Midday Meal backend."""


class MiddayMealError(Exception):
    """Base exception for Midday Meal application."""
    pass


class ConfigurationError(MiddayMealError):
    """Raised when required configuration or API keys are missing or invalid."""
    pass


class TranscriptionError(MiddayMealError):
    """Raised when audio transcription fails or exceeds constraints."""
    pass


class ExtractionError(MiddayMealError):
    """Raised when LLM text-to-ledger extraction fails or exceeds constraints."""
    pass
