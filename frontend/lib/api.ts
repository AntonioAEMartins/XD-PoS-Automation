// Thin adapter over the in-browser PoS simulator. Every call here goes through
// the real MessageBuilder → TCPClient → MockPoSServer stack, producing fresh
// wire traces on each invocation. State persists across navigations within a
// tab (resets on full reload) via StateStore's module-level singleton.

import { RestaurantClient, paginateTables, summarizeTables } from "@/lib/pos";
import type {
  ActionResponse,
  TableContentResponse,
  TablesResponse,
  WhatsAppResponse,
} from "./types";

export type GetTablesParams = {
  page?: number;
  pageSize?: number;
};

export async function getTables(params?: GetTablesParams): Promise<TablesResponse> {
  const { tables, wireTrace } = await RestaurantClient.getInstance().fetchTablesWithTrace();
  const { tables: visible, pagination } = paginateTables(
    tables,
    params?.page,
    params?.pageSize
  );
  return {
    tables: visible,
    wire_trace: wireTrace,
    summary: summarizeTables(tables),
    pagination,
  };
}

export async function getTable(
  tableId: number | string
): Promise<TableContentResponse> {
  const { table, wireTrace } = await RestaurantClient.getInstance().fetchTableContentWithTrace(
    Number(tableId)
  );
  return { table, wire_trace: wireTrace };
}

export async function postPrebill(
  tableId: number | string
): Promise<ActionResponse> {
  const { result, wireTrace } = await RestaurantClient.getInstance().prebillWithTrace(
    Number(tableId)
  );
  return { result, wire_trace: wireTrace };
}

export async function postCloseTable(
  tableId: number | string
): Promise<ActionResponse> {
  const { result, wireTrace } = await RestaurantClient.getInstance().closeTableWithTrace(
    Number(tableId)
  );
  return { result, wire_trace: wireTrace };
}

export async function getTableMessage(
  tableId: number | string
): Promise<WhatsAppResponse> {
  return RestaurantClient.getInstance().getWhatsAppMessage(Number(tableId));
}
