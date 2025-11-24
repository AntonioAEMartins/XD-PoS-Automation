import asyncio
import json
import logging
import random
import time
import uuid
from typing import Any, Awaitable, Dict, List, Optional, Tuple

from fastapi import HTTPException
from faker import Faker

from ..builders.pos_message_builder import MessageBuilder
from ..models.entity_models import Product, Table
from .token_manager import TokenManager

# Configure logging for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture all levels of logs

# Create handler (console in this case, but can be file or other handlers)
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)

# Create formatter and add it to the handler
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

# Add the handler to the logger if it doesn't have handlers already
if not logger.handlers:
    logger.addHandler(handler)

fake = Faker("pt_BR")


class RestaurantMockClient:
    USER_ID: str = "1"
    APP_VERSION: str = "1.0"
    PROTOCOL_VERSION: str = "1"
    LIMIT: int = 5000

    def __init__(self, token_manager: TokenManager):
        """
        Initialize the RestaurantMockClient with a TokenManager.
        Loads mock products and tables.
        """
        logger.info("Initializing RestaurantMockClient.")
        self.token_manager = token_manager
        self.message_builder = MessageBuilder(
            user_id=self.USER_ID,
            app_version=self.APP_VERSION,
            protocol_version=self.PROTOCOL_VERSION,
        )
        self.message_builder.token_manager = self.token_manager
        try:
            self.products = self._load_mock_products()
            logger.info(f"Loaded {len(self.products)} mock products.")
        except Exception as e:
            logger.exception("Failed to load mock products.")
            raise

        try:
            self.tables = self._load_mock_tables()
            logger.info(f"Initialized {len(self.tables)} mock tables.")
        except Exception as e:
            logger.exception("Failed to load mock tables.")
            raise

    def _format_ascii(self, value: str) -> str:
        """Return the ASCII-safe version of a string."""
        return value.encode("ascii", errors="replace").decode("ascii")

    def _to_hex(self, value: str) -> str:
        """Return hexadecimal representation of a string."""
        return value.encode().hex()

    def _wire_repr(self, payload: Any) -> str:
        """Serialize payloads for trace visualization."""
        try:
            return json.dumps(payload, default=str)
        except Exception:
            return str(payload)

    def _build_wire_trace(
        self,
        request: str,
        response_payload: Any,
        payloads: Optional[Dict[str, Any]] = None,
        pos_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build a lightweight mock wire trace that mirrors the production shape."""
        response_str = self._wire_repr(response_payload)
        return {
            "request": {
                "raw": request,
                "ascii": self._format_ascii(request),
                "hex": self._to_hex(request),
            },
            "response": {
                "raw": response_str,
                "ascii": self._format_ascii(response_str),
                "hex": self._to_hex(response_str),
            },
            "payloads": payloads or {},
            "pos_message": pos_message or request,
        }

    async def load_products(self):
        """
        Mock method to simulate loading products.
        Here it's already done in __init__, so it just logs the action.
        """
        logger.debug(
            "Called load_products, but products are already loaded in __init__."
        )

    def _load_mock_products(self) -> Dict[int, Product]:
        """
        Initialize a set of mock products with realistic Portuguese names and unique IDs.
        """
        logger.debug("Loading mock products.")
        predefined_items = [
            {"id": 2001, "name": "Picanha na Chapa"},
            {"id": 2002, "name": "Costela de Cordeiro"},
            {"id": 2003, "name": "Fraldinha Grelhada"},
            {"id": 2004, "name": "Asinha de Frango"},
            {"id": 2005, "name": "Linguiça Artesanal"},
            {"id": 2006, "name": "Bife de Ancho"},
            {"id": 2007, "name": "Maminha Assada"},
            {"id": 2008, "name": "Espetinho Misto"},
            {"id": 2009, "name": "Churrasco de Picanha"},
            {"id": 2010, "name": "Tábua de Frios"},
            {"id": 2011, "name": "Salada Caesar com Frango"},
            {"id": 2012, "name": "Risoto de Cogumelos"},
            {"id": 2013, "name": "Moqueca de Peixe"},
            {"id": 2014, "name": "Feijoada Completa"},
            {"id": 2015, "name": "Bacalhau à Brás"},
            {"id": 2016, "name": "Camarão na Moranga"},
            {"id": 2017, "name": "Bobó de Camarão"},
            {"id": 2018, "name": "Pudim de Leite"},
            {"id": 2019, "name": "Brigadeiro Gourmet"},
            {"id": 2020, "name": "Quindim Tradicional"},
        ]

        products = {
            item["id"]: Product(id=item["id"], name=item["name"])
            for item in predefined_items
        }
        logger.debug(f"Mock products loaded: {products}")
        return products

    def _load_mock_tables(self) -> List[Table]:
        """
        Initialize 100 mock tables with random statuses and attributes.
        """
        logger.debug("Loading mock tables.")
        statuses = [1, 1, 2]  # 1: Occupied, 2: Reserved (varied distribution)
        mock_tables = []
        for i in range(1, 100):  # 99 tables (IDs 1 to 99)
            table = Table(
                id=i,
                name=str(i),
                status=random.choice(statuses),
                lockDescription=None,
                inactive=False,
                freeTable=random.choice([True, True]),
                initialUser=random.randint(0, 20),
            )
            mock_tables.append(table)
            logger.debug(f"Loaded mock table: {table}")
        logger.debug("All mock tables loaded successfully.")
        return mock_tables

    async def fetch_table_content(self, table_id: int) -> Dict:
        """
        Mock method to fetch table content with random orders.
        This simulates what fetch_table_content does in RestaurantClient.
        """
        content, _ = await self._fetch_table_content(table_id=table_id, include_trace=False)
        return content

    async def fetch_table_content_with_trace(self, table_id: int) -> Dict[str, Any]:
        """Return mock table content along with a trace envelope."""
        content, trace = await self._fetch_table_content(table_id=table_id, include_trace=True)
        return {"table": content, "wire_trace": trace}

    async def _fetch_table_content(
        self, table_id: int, include_trace: bool = False
    ) -> Tuple[Dict, Optional[Dict[str, Any]]]:
        """Generate mock table content and optionally return trace data."""
        logger.info(f"Fetching content for table ID: {table_id}")
        try:
            await self.token_manager.get_token()
            if self.token_manager.is_token_expired():
                logger.warning("Token expired while fetching table content.")
                raise HTTPException(status_code=401, detail="Token expired")

            if (
                not isinstance(table_id, int)
                or table_id < 1
                or table_id > len(self.tables)
            ):
                logger.error(f"Invalid table ID: {table_id}. Mesa não encontrada.")
                raise HTTPException(status_code=404, detail="Mesa não encontrada.")

            table = self.tables[table_id - 1]
            table_status = table.status
            logger.debug(f"Table ID {table_id} status: {table_status}")

            request_message: Optional[str] = None
            if include_trace:
                request_message = await self._build_protocol_message(
                    self.message_builder.build_get_board_content(
                        board_id=str(table_id)
                    ),
                    fallback_label=f"FETCH_TABLE_CONTENT::{table_id}",
                )

            if table_status == 0:
                logger.info(f"Table ID {table_id} is available. No content to fetch.")
                content = {
                    "id": table_id,
                    "status": table_status,
                    "tableLocation": None,
                    "content": [],
                    "total": 0.0,
                    "globalDiscount": 0.0,
                }
                trace = None
                if include_trace:
                    trace = self._build_wire_trace(
                        request=request_message
                        or f"MOCK::FETCH_TABLE_CONTENT::{table_id}",
                        response_payload=content,
                        payloads={"response_boardinfo": content},
                        pos_message=request_message,
                    )
                return content, trace

            num_orders = random.randint(2, 6)
            logger.debug(
                f"Generating {num_orders} mock orders for table ID {table_id}."
            )
            order_content = []
            total = 0.0
            for _ in range(num_orders):
                product = random.choice(list(self.products.values()))
                quantity = random.randint(1, 2)
                price = round(random.uniform(20.0, 100.0), 2)
                total_price = round(quantity * price, 2)
                order = {
                    "itemId": product.id,
                    "itemType": random.choice([0, 1, 2, 3]),
                    "parentPosition": -1,
                    "quantity": float(quantity),
                    "price": price,
                    "additionalInfo": fake.sentence(nb_words=6),
                    "guid": str(uuid.uuid4()),
                    "employee": random.randint(1, 50),
                    "time": int(time.time() * 1000),
                    "lineLevel": 0,
                    "ratio": random.choice([0, 1]),
                    "total": total_price,
                    "lineDiscount": round(random.uniform(0.0, 10.0), 2),
                    "completed": random.choice([True, False]),
                    "parentGuid": "00000000-0000-0000-0000-000000000000",
                    "itemName": product.name,
                }
                order_content.append(order)
                total += total_price
                logger.debug(f"Generated mock order: {order}")

            mock_table_content = {
                "id": table_id,
                "status": table_status,
                "tableLocation": (
                    fake.address() if random.choice([True, False]) else None
                ),
                "content": order_content,
                "total": round(total, 2),
                "globalDiscount": round(random.uniform(0.0, 20.0), 2),
            }
            await asyncio.sleep(
                random.uniform(0.05, 0.2)
            )  # Simulate asynchronous operation
            logger.debug(f"Fetched table content: {mock_table_content}")

            wire_trace = None
            if include_trace:
                wire_trace = self._build_wire_trace(
                    request=request_message
                    or f"MOCK::FETCH_TABLE_CONTENT::{table_id}",
                    response_payload=mock_table_content,
                    payloads={"response_boardinfo": mock_table_content},
                    pos_message=request_message,
                )
            return mock_table_content, wire_trace
        except HTTPException as http_exc:
            logger.error(f"HTTPException in fetch_table_content: {http_exc.detail}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error in fetch_table_content: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor.")

    async def fetch_tables(self) -> List[Table]:
        """
        Mock method to fetch a list of tables, simulating what fetch_tables does in RestaurantClient.
        """
        tables, _ = await self._fetch_tables(include_trace=False)
        return tables

    async def fetch_tables_with_trace(self) -> Dict[str, Any]:
        """Return tables plus a lightweight mock wire trace."""
        tables, trace = await self._fetch_tables(include_trace=True)
        return {"tables": tables, "wire_trace": trace}

    async def _fetch_tables(
        self, include_trace: bool = False
    ) -> Tuple[List[Table], Optional[Dict[str, Any]]]:
        """Internal helper to fetch tables with optional mock trace."""
        logger.info("Fetching list of tables.")
        try:
            await self.token_manager.get_token()
            if self.token_manager.is_token_expired():
                logger.warning("Token expired while fetching tables.")
                raise HTTPException(status_code=401, detail="Token expired")

            await asyncio.sleep(
                random.uniform(0.05, 0.2)
            )  # Simulate asynchronous operation
            logger.debug(f"Fetched {len(self.tables)} mock tables.")
            wire_trace = None
            if include_trace:
                payloads = {"response_object": [table.model_dump() for table in self.tables]}
                request_message = await self._build_protocol_message(
                    self.message_builder.build_get_data_list(
                        object_type="XDPeople.Entities.MobileBoardStatus",
                        part=0,
                        limit=self.LIMIT,
                        message_id=str(uuid.uuid4()),
                    ),
                    fallback_label="FETCH_TABLES",
                )
                wire_trace = self._build_wire_trace(
                    request=request_message,
                    response_payload=payloads["response_object"],
                    payloads=payloads,
                    pos_message=request_message,
                )
            return self.tables, wire_trace
        except HTTPException as http_exc:
            logger.error(f"HTTPException in fetch_tables: {http_exc.detail}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error in fetch_tables: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor.")

    async def prebill(self, table_id: int) -> str:
        """
        Mock method to simulate the prebill action.
        Similar logic to RestaurantClient's prebill method:
        - Fetch table content
        - If no orders, 404
        - Otherwise, simulate posting the queue and return success.
        """
        result, _ = await self._prebill(table_id=table_id, include_trace=False)
        return result

    async def prebill_with_trace(self, table_id: int) -> Dict[str, Any]:
        """Mocked prebill with trace metadata."""
        result, trace = await self._prebill(table_id=table_id, include_trace=True)
        return {"result": result, "wire_trace": trace}

    async def _prebill(
        self, table_id: int, include_trace: bool = False
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """Internal helper for prebill with optional trace."""
        logger.info(f"Initiating prebill for table ID: {table_id}")
        try:
            await self.token_manager.get_token()
            if self.token_manager.is_token_expired():
                logger.warning("Token expired while initiating prebill.")
                raise HTTPException(status_code=401, detail="Token expired")

            content = await self.fetch_table_content(table_id)
            orders = content.get("content", [])
            if not orders:
                logger.warning(
                    f"No orders found for table ID: {table_id}. Cannot generate prebill."
                )
                raise HTTPException(
                    status_code=404, detail="No orders found for the table."
                )

            self.tables[table_id - 1].status = 2
            self.tables[table_id - 1].freeTable = False
            await asyncio.sleep(
                random.uniform(0.05, 0.2)
            )  # Simulate asynchronous operation
            logger.info(f"Prebill posted successfully for table ID: {table_id}.")

            wire_trace = None
            if include_trace:
                request_message = await self._build_protocol_message(
                    self.message_builder.build_prebill_message(
                        employee_id=int(self.USER_ID),
                        table=table_id,
                        orders=orders,
                    ),
                    fallback_label=f"PREBILL::{table_id}",
                )
                payloads = {
                    "response_message": "Pré-conta gerada com sucesso.",
                    "orders": orders,
                }
                wire_trace = self._build_wire_trace(
                    request=request_message,
                    response_payload=payloads,
                    payloads=payloads,
                    pos_message=request_message,
                )
            return "Pré-conta gerada com sucesso.", wire_trace
        except HTTPException as http_exc:
            logger.error(f"HTTPException in prebill: {http_exc.detail}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error in prebill: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor.")

    async def close_table(self, table_id: int) -> str:
        """
        Mock method to simulate closing a table, as per the close_table method in RestaurantClient.
        """
        result, _ = await self._close_table(table_id=table_id, include_trace=False)
        return result

    async def close_table_with_trace(self, table_id: int) -> Dict[str, Any]:
        """Close a table and include a mock wire trace."""
        result, trace = await self._close_table(table_id=table_id, include_trace=True)
        return {"result": result, "wire_trace": trace}

    async def _close_table(
        self, table_id: int, include_trace: bool = False
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """Internal helper to close a table with optional trace."""
        logger.info(f"Closing table ID: {table_id}")
        try:
            await self.token_manager.get_token()
            if self.token_manager.is_token_expired():
                logger.warning("Token expired while closing table.")
                raise HTTPException(status_code=401, detail="Token expired")

            if table_id < 1 or table_id > len(self.tables):
                logger.error(f"Invalid table ID: {table_id}. Mesa não encontrada.")
                raise HTTPException(status_code=404, detail="Mesa não encontrada.")

            self.tables[table_id - 1].status = 0
            self.tables[table_id - 1].freeTable = True
            await asyncio.sleep(
                random.uniform(0.05, 0.2)
            )  # Simulate asynchronous operation
            logger.info(f"Table ID {table_id} closed successfully.")

            wire_trace = None
            if include_trace:
                request_message = await self._build_protocol_message(
                    self.message_builder.build_close_table_message(
                        employee_id=int(self.USER_ID),
                        table=table_id,
                    ),
                    fallback_label=f"CLOSE_TABLE::{table_id}",
                )
                payloads = {
                    "response_message": "Mesa fechada com sucesso.",
                    "table": table_id,
                }
                wire_trace = self._build_wire_trace(
                    request=request_message,
                    response_payload=payloads,
                    payloads=payloads,
                    pos_message=request_message,
                )
            return "Mesa fechada com sucesso.", wire_trace
        except HTTPException as http_exc:
            logger.error(f"HTTPException in close_table: {http_exc.detail}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error in close_table: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor.")

    async def _build_protocol_message(
        self, builder_coro: Awaitable[str], fallback_label: str
    ) -> str:
        """Safely build PoS protocol messages, falling back to descriptive mock labels."""
        try:
            return await builder_coro
        except Exception as exc:  # pragma: no cover - diagnostic path
            logger.warning(
                "Failed to build %s protocol message. Falling back to mock label. Error: %s",
                fallback_label,
                exc,
            )
            return f"MOCK::{fallback_label}"
