import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import get_restaurant_client, handle_request_exception
from src.clients.restaurant_client import RestaurantClient
from src.services.table_cache import (
    get_table_detail_response,
    get_tables_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/frontend",
    tags=["frontend"],
    responses={401: {"description": "Authentication error"}},
)


@router.get("/tables")
async def list_tables(
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1),
    client: RestaurantClient = Depends(get_restaurant_client),
):
    """List tables (optionally paginated) along with the TCP wire trace."""
    try:
        payload = await get_tables_response(
            client, page=page, page_size=page_size, include_wire_trace=True
        )
        return payload
    except HTTPException as exc:
        raise exc
    except Exception as e:
        logger.error(f"Failed to list tables: {e}")
        handle_request_exception(e)


@router.get("/tables/{table_id}")
async def get_table(
    table_id: int, client: RestaurantClient = Depends(get_restaurant_client)
):
    """Fetch a specific table with its content and trace metadata."""
    try:
        payload = await get_table_detail_response(
            client, table_id, include_wire_trace=True
        )
        return payload
    except Exception as e:
        logger.error(f"Failed to fetch table {table_id}: {e}")
        handle_request_exception(e)


@router.post("/tables/{table_id}/prebill")
async def create_prebill(
    table_id: int, client: RestaurantClient = Depends(get_restaurant_client)
):
    """Generate a prebill for a table and expose the raw TCP trace."""
    try:
        payload = await client.prebill_with_trace(table_id)
        return payload
    except Exception as e:
        logger.error(f"Failed to prebill table {table_id}: {e}")
        handle_request_exception(e)


@router.post("/tables/{table_id}/close")
async def close_table(
    table_id: int, client: RestaurantClient = Depends(get_restaurant_client)
):
    """Close a table and expose the raw TCP trace."""
    try:
        payload = await client.close_table_with_trace(table_id)
        return payload
    except Exception as e:
        logger.error(f"Failed to close table {table_id}: {e}")
        handle_request_exception(e)


frontend_router = router
