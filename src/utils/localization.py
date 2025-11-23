from __future__ import annotations

from typing import Dict, Optional

LANGUAGE_LABELS = {
    "pt-br": {
        "unit_label": "un.",
        "service_fee": "Taxa de Serviço",
        "gross_total": "Total Bruto",
        "separator": "\n-----------------------------------\n",
        "status_success": "Mensagem processada com sucesso",
    },
    "en-us": {
        "unit_label": "units",
        "service_fee": "Service Fee",
        "gross_total": "Gross Total",
        "separator": "\n-----------------------------------\n",
        "status_success": "Message processed successfully",
    },
}


def normalize_language(language: Optional[str]) -> str:
    """
    Ensure the language code maps to one of the supported keys by coalescing
    short aliases like `en`/`pt` or underscore separated variants.
    """
    if not language:
        return "pt-br"

    normalized = language.strip().lower().replace("_", "-")
    if normalized in LANGUAGE_LABELS:
        return normalized
    if normalized.startswith("en"):
        return "en-us"
    if normalized.startswith("pt"):
        return "pt-br"
    return "pt-br"


def get_language_labels(language: Optional[str]) -> Dict[str, str]:
    """Return the label dictionary for the requested language."""
    normalized = normalize_language(language)
    return LANGUAGE_LABELS.get(normalized, LANGUAGE_LABELS["pt-br"])


def format_currency(value: float, language: Optional[str] = None) -> str:
    """Format numeric currency respecting the target language formatting."""
    normalized = normalize_language(language)
    amount = float(value or 0.0)
    formatted = f"{amount:,.2f}"
    if normalized == "pt-br":
        formatted = formatted.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"

