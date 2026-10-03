from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized application configuration with fail-fast startup validation."""
    DATABASE_URL: str = "sqlite:///./middaymeal.db"
    GROQ_API_KEY: str = ""
    GROQ_LLM_MODEL: str = "openai/gpt-oss-120b"
    SQL_ECHO: bool = False

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent / ".env"),
            str(Path(__file__).resolve().parent.parent / ".env")
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
