import logging
from typing import Any

from fastapi import Depends, HTTPException

from src.clients.mock_restaurant_client import RestaurantMockClient
from src.clients.restaurant_client import RestaurantClient
from src.clients.token_manager import TokenManager
from src.order_processor.order_chain import OrderProcessorChain
from src.utils.settings import get_settings

logger = logging.getLogger(__name__)


async def get_token_manager() -> TokenManager:
    """Instantiate a TokenManager using config.ini."""
    settings = get_settings()
    app_mode = settings.app_mode
    use_mock = app_mode.lower() == "dev"
    coti_api_url = settings.coti_cloud_services_url
    token_manager = TokenManager(use_mock=use_mock, url=coti_api_url)
    return token_manager


def get_restaurant_client(
    token_manager: TokenManager = Depends(get_token_manager),
) -> Any:
    """Return the configured RestaurantClient or its mock counterpart."""
    if token_manager.use_mock:
        logger.info("Running in development mode. Using RestaurantMockClient.")
        return RestaurantMockClient(token_manager=token_manager)
    logger.info("Running in production mode. Using RestaurantClient.")
    return RestaurantClient(token_manager=token_manager)


def get_order_processor_chain() -> OrderProcessorChain:
    """Provide the shared OrderProcessorChain instance."""
    return OrderProcessorChain()


def handle_request_exception(e: Exception):
    """Normalize exception handling for HTTP responses."""
    if hasattr(e, "status_code") and e.status_code == 401:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=401, detail="Smart Connect Authentication Error"
        )
    logger.error(f"Unhandled exception: {e}")
    raise HTTPException(status_code=500, detail="An unexpected error occurred.")
