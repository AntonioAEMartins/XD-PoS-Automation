from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Sequence, Tuple

from fastapi import HTTPException

from src.models.entity_models import Table

if TYPE_CHECKING:  # pragma: no cover - import used for typing only
    from src.clients.restaurant_client import RestaurantClient


@dataclass
class TablesSnapshot:
    """Simple in-memory cache for the latest tables payload."""

    tables: List[Table]
    wire_trace: Optional[Dict[str, Any]]
    fetched_at: float


@dataclass
class TableDetailSnapshot:
    """Cache entry for a specific table content response."""

    table_id: int
    table: Dict[str, Any]
    wire_trace: Optional[Dict[str, Any]]
    fetched_at: float


_SNAPSHOT: Optional[TablesSnapshot] = None
_TABLE_DETAILS: Dict[int, TableDetailSnapshot] = {}


async def get_tables_snapshot(client: "RestaurantClient") -> TablesSnapshot:
    """
    Return the cached tables snapshot, fetching it lazily on first access.

    The snapshot persists for the lifetime of the FastAPI process so repeated
    pagination requests operate on a consistent dataset.
    """

    global _SNAPSHOT
    if _SNAPSHOT is None:
        payload = await client.fetch_tables_with_trace()
        _SNAPSHOT = TablesSnapshot(
            tables=payload["tables"],
            wire_trace=payload.get("wire_trace"),
            fetched_at=time.time(),
        )
    return _SNAPSHOT


def reset_tables_snapshot() -> None:
    """Clear the cached snapshot (mainly useful for tests or manual resets)."""

    global _SNAPSHOT
    _SNAPSHOT = None


def reset_table_detail_snapshot(table_id: Optional[int] = None) -> None:
    """
    Clear cached table detail payloads (all or a single entry).
    """

    global _TABLE_DETAILS
    if table_id is None:
        _TABLE_DETAILS = {}
        return
    _TABLE_DETAILS.pop(table_id, None)


def summarize_tables(tables: Sequence[Table]) -> Dict[str, int]:
    """Calculate aggregate counts for the UI summary cards."""

    return {
        "total": len(tables),
        "open": sum(1 for t in tables if t.status == 1),
        "closing": sum(1 for t in tables if t.status == 2),
        "free": sum(1 for t in tables if t.status == 0),
    }


def paginate_tables(
    tables: Sequence[Table],
    page: Optional[int],
    page_size: Optional[int],
) -> Tuple[List[Table], Optional[Dict[str, Any]]]:
    """
    Slice the tables list using 1-based `page` and positive `page_size`.

    Returns the visible tables plus pagination metadata (or None when pagination
    parameters are absent).
    """

    if page is None and page_size is None:
        return list(tables), None
    if (page is None) != (page_size is None):
        raise HTTPException(
            status_code=400,
            detail="Both page and page_size must be provided to enable pagination.",
        )
    assert page is not None and page_size is not None  # for type checkers
    if page <= 0 or page_size <= 0:
        raise HTTPException(
            status_code=400, detail="page and page_size must be positive integers."
        )

    total_items = len(tables)
    total_pages = max(1, math.ceil(total_items / page_size)) if total_items else 1
    start_index = (page - 1) * page_size

    if total_items and start_index >= total_items:
        raise HTTPException(status_code=404, detail="Requested page is out of range.")

    end_index = min(start_index + page_size, total_items)
    visible_tables = list(tables[start_index:end_index])

    pagination_meta = {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_previous": page > 1 and total_items > 0,
        "has_next": page < total_pages and total_items > 0,
        "start_index": start_index + 1 if total_items else 0,
        "end_index": end_index if total_items else 0,
    }

    return visible_tables, pagination_meta


async def get_tables_response(
    client: "RestaurantClient",
    *,
    page: Optional[int],
    page_size: Optional[int],
    include_wire_trace: bool = False,
) -> Dict[str, Any]:
    """
    Compose the full response payload used by both /tables endpoints.
    """

    snapshot = await get_tables_snapshot(client)
    tables_slice, pagination = paginate_tables(snapshot.tables, page, page_size)

    payload: Dict[str, Any] = {
        "tables": tables_slice,
        "summary": summarize_tables(snapshot.tables),
    }

    if include_wire_trace and snapshot.wire_trace is not None:
        payload["wire_trace"] = snapshot.wire_trace

    if pagination:
        payload["pagination"] = pagination

    return payload


async def _refresh_table_detail_snapshot(
    client: "RestaurantClient",
    table_id: int,
    include_wire_trace: bool,
) -> TableDetailSnapshot:
    """Fetch table content (optionally with trace) and persist it."""

    if include_wire_trace:
        payload = await client.fetch_table_content_with_trace(table_id)
        table = payload["table"]
        wire_trace = payload.get("wire_trace")
    else:
        table = await client.fetch_table_content(table_id)
        wire_trace = None

    snapshot = TableDetailSnapshot(
        table_id=table_id,
        table=table,
        wire_trace=wire_trace,
        fetched_at=time.time(),
    )
    _TABLE_DETAILS[table_id] = snapshot
    return snapshot


async def get_table_detail_response(
    client: "RestaurantClient",
    table_id: int,
    *,
    include_wire_trace: bool,
) -> Dict[str, Any]:
    """
    Return the cached table detail payload (table + optional trace).
    """

    snapshot = _TABLE_DETAILS.get(table_id)
    needs_wire_trace = include_wire_trace and (
        snapshot is None or snapshot.wire_trace is None
    )

    if snapshot is None or needs_wire_trace:
        snapshot = await _refresh_table_detail_snapshot(
            client, table_id, include_wire_trace=include_wire_trace
        )

    payload: Dict[str, Any] = {"table": snapshot.table}
    if include_wire_trace and snapshot.wire_trace is not None:
        payload["wire_trace"] = snapshot.wire_trace
    return payload

