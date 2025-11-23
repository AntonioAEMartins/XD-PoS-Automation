import logging
import os
from typing import Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from src.api.dependencies import (
    get_order_processor_chain,
    get_restaurant_client,
    get_token_manager,
    handle_request_exception,
)
from src.api.frontend_monitor import frontend_router
from src.clients.restaurant_client import RestaurantClient
from src.clients.token_manager import TokenManager
from src.middleware.timing_middleware import TimingMiddleware
from src.order_processor.order_chain import OrderProcessorChain
from src.services.table_cache import get_table_detail_response, get_tables_response
from src.utils.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
frontend_origins = list(settings.frontend_allowed_origins or ("http://localhost:3000",))

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

app.add_middleware(TimingMiddleware)

class BaseResponse(BaseModel):
    response_time: float


class ValidateAuthResponse(BaseResponse):
    is_authenticated: bool


@app.get("/auth/validate", response_model=ValidateAuthResponse)
async def validate_auth(token_manager: TokenManager = Depends(get_token_manager)):
    """
    Validate if the token is authenticated.
    """
    is_authenticated = await token_manager.is_authenticated()
    return ValidateAuthResponse(
        is_authenticated=is_authenticated, response_time=0.0
    )  # response_time will be updated by middleware


# @app.post("/message/")
@app.get("/tables/{table_id}/message/")
async def create_board_message(
    table_id: int,
    client: RestaurantClient = Depends(get_restaurant_client),
    order_processor: OrderProcessorChain = Depends(get_order_processor_chain),
):
    """
    Endpoint to create a board message by fetching table content,
    formatting the order, and processing it.
    """
    table_id = table_id
    try:
        # Validate table_id is an integer
        if not isinstance(table_id, int):
            raise HTTPException(status_code=400, detail="table_id must be an integer.")

        # Fetch the table order from the RestaurantClient (cached snapshot)
        payload = await get_table_detail_response(
            client, table_id, include_wire_trace=True
        )
        table_order = payload["table"]

        if not table_order["content"]:
            raise HTTPException(status_code=404, detail="Table content not found.")

        # Create the file name based on the table_id
        file_name = f"comanda_{table_id}.txt"
        file_path = os.path.join(os.getcwd(), file_name)

        processed_table_items = []

        # Format the order
        formatted_order = ""
        for item in table_order.get("content", []):
            product_name = item.get("itemName", "Not found")
            quantity = item.get("quantity", 1)
            price = item.get("price", 0.0)
            total = item.get("total", 0.0)
            # Format the line
            line = f"{product_name} - {quantity} X R$ {price:.2f} = R$ {total:.2f}\n"
            formatted_order += line
            processed_table_items.append(
                {
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price,
                    "total": total,
                }
            )

        # Process the formatted order
        print("Formatted order:", formatted_order)
        order = await order_processor.main(formatted_order, file_path)
        order["details"]["orders"] = processed_table_items
        return order

    except httpx.HTTPStatusError as groq_error:
        logger.error("Groq API error for table %s: %s", table_id, groq_error)
        raise HTTPException(
            status_code=502,
            detail="Unable to enhance WhatsApp message via Groq at the moment.",
        ) from groq_error
    except ValueError as config_error:
        logger.error("Groq configuration error: %s", config_error)
        raise HTTPException(
            status_code=500, detail="Groq configuration error. Please check config.ini."
        ) from config_error
    except Exception as e:
        handle_request_exception(e)


@app.post("/load/products/")
async def load_products(
    client: RestaurantClient = Depends(get_restaurant_client),
):
    """
    Endpoint to load products from a file.
    """
    try:
        # Load products from file
        response = await client.load_products()
        return response

    except Exception as e:
        handle_request_exception(e)


# /tables/{table_id} was @app.post("/order/")
@app.get("/tables/{table_id}")
async def get_table(
    table_id: int, client: RestaurantClient = Depends(get_restaurant_client)
):
    """
    Get details of a specific table by ID (if necessary).
    """
    try:
        payload = await get_table_detail_response(
            client, table_id, include_wire_trace=True
        )
        return payload["table"]
    except Exception as e:
        handle_request_exception(e)


@app.get("/tables")
async def list_tables(
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1),
    client: RestaurantClient = Depends(get_restaurant_client),
):
    """
    Retrieve a list of tables with optional pagination metadata.
    """
    try:
        return await get_tables_response(
            client, page=page, page_size=page_size, include_wire_trace=False
        )
    except HTTPException as exc:
        raise exc
    except Exception as e:
        handle_request_exception(e)


# @app.post("/payment/")
@app.get("/tables/{table_id}/payment/")
async def set_payment_status(
    table_id: int,
    client: RestaurantClient = Depends(get_restaurant_client),
):
    """
    Endpoint to set the payment status for a specific table.

    Args:
        client (RestaurantClient): The RestaurantClient instance.

    Returns:
        dict: A success message with the server response.
    """
    table_id = table_id
    try:
        # Send a POSTQUEUE message to set the payment status
        response = await client.prebill(table_id)
        return {"status": "Payment status set successfully", "response": response}

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions to maintain consistent error responses
        logger.error(
            f"HTTP error setting payment status for table {table_id}: {http_exc.detail}"
        )
        raise http_exc
    except Exception as e:
        handle_request_exception(e)


# @app.post("/close/")
@app.get("/tables/{table_id}/close/")
async def close_table_endpoint(
    table_id: int,
    client: RestaurantClient = Depends(get_restaurant_client),
):
    """
    Endpoint to close a specific table after payment.

    Args:
        client (RestaurantClient): The RestaurantClient instance.

    Returns:
        dict: A success message with the server response.
    """
    table_id = table_id
    try:
        # Send a POSTQUEUE message to close the table
        response = await client.close_table(table_id)
        return {"status": "Table closed successfully", "response": response}

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions to maintain consistent error responses
        logger.error(f"HTTP error closing table {table_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        handle_request_exception(e)


app.include_router(frontend_router)


if __name__ == "__main__":
    import importlib

    try:
        uvicorn = importlib.import_module("uvicorn")
    except ImportError as exc:  # pragma: no cover - only triggered in dev
        raise RuntimeError(
            "Uvicorn is required to run the development server. Install it via `pip install uvicorn`."
        ) from exc
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
