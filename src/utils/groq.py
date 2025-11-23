from langchain_groq import ChatGroq

from src.utils.settings import get_settings


def build_chat_groq(*, temperature: float = 0.0) -> ChatGroq:
    """
    Return a configured ChatGroq client using values from config.ini.

    Raises:
        ValueError: If the Groq API key or model name is missing.
    """
    settings = get_settings()
    api_key = settings.groq_api_key
    model_name = settings.groq_model_name
    if not api_key:
        raise ValueError("Missing GROQ_API_KEY in configuration.")
    if not model_name:
        raise ValueError("Missing groq_model_name in configuration.")
    return ChatGroq(
        model_name=model_name,
        temperature=temperature,
        groq_api_key=api_key,
    )

