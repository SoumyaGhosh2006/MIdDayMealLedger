"""Custom domain exceptions for Midday Meal backend."""


class MiddayMealError(Exception):
    """Base exception for Midday Meal application."""
    pass


class ConfigurationError(MiddayMealError):
    """Raised when required configuration or API keys are missing or invalid."""
    pass


class TranscriptionError(MiddayMealError):
    """Raised when audio transcription fails or encounters an upstream error."""
    pass


class AudioTooLargeError(TranscriptionError):
    """Raised when uploaded audio exceeds maximum allowed file size."""
    pass


class ExtractionError(MiddayMealError):
    """Raised when LLM text-to-ledger extraction fails or encounters an upstream error."""
    pass


class TranscriptTooLargeError(ExtractionError):
    """Raised when transcript exceeds maximum allowed character length."""
    pass


class DuplicateLedgerError(MiddayMealError):
    """Raised when attempting to create a ledger entry for a date that already exists."""
    pass
