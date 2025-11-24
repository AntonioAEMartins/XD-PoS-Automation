from __future__ import annotations

import configparser
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from src.utils.localization import normalize_language

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config.ini"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


@dataclass(frozen=True)
class Settings:
    """Container for strongly typed configuration values."""

    openai_api_key: Optional[str]
    perplexity_api_key: Optional[str]
    groq_api_key: Optional[str]
    groq_model_name: str
    app_mode: str
    coti_cloud_services_url: str
    language: str
    frontend_allowed_origins: tuple[str, ...]


def _normalize_string(raw_value: Optional[str], default: str = "") -> str:
    """Trim whitespace and fall back to default when empty."""
    if raw_value is None:
        return default
    value = raw_value.strip()
    return value or default


def _parse_origins(raw_value: Optional[str]) -> tuple[str, ...]:
    """Split comma-separated origins, falling back to localhost."""
    if not raw_value:
        return ("http://localhost:3000",)
    origins = tuple(
        origin.strip()
        for origin in raw_value.split(",")
        if origin.strip()
    )
    return origins or ("http://localhost:3000",)


@lru_cache(maxsize=1)
def get_settings(config_path: Path = DEFAULT_CONFIG_PATH) -> Settings:
    """
    Load Settings from config.ini once and memoize the parsed result.

    The cache can be cleared via `refresh_settings()` if the on-disk config changes.
    """
    parser = configparser.ConfigParser()
    if not parser.read(config_path):
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    if "Settings" not in parser:
        raise KeyError("Missing 'Settings' section in config file.")

    section = parser["Settings"]
    return Settings(
        openai_api_key=section.get("openaiAPIKey"),
        perplexity_api_key=section.get("perplexityAPIKey"),
        groq_api_key=section.get("GROQ_API_KEY"),
        groq_model_name=_normalize_string(
            section.get("groq_model_name"), DEFAULT_GROQ_MODEL
        ),
        app_mode=section.get("app_mode", "prod"),
        coti_cloud_services_url=section.get(
            "coti_cloud_services_url", "http://localhost:8005"
        ),
        language=normalize_language(section.get("language")),
        frontend_allowed_origins=_parse_origins(
            section.get("frontend_allowed_origins")
        ),
    )


def refresh_settings():
    """Clear the cached Settings object. Useful for tests."""
    get_settings.cache_clear()


def get_setting(key: str, default: Any = None) -> Any:
    """
    Convenience accessor for individual configuration values.

    Falls back to `default` when the attribute is not defined.
    """
    settings = get_settings()
    return getattr(settings, key, default)

