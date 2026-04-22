"use client";

import useSWR, { type SWRConfiguration } from "swr";

import { getTable, getTableMessage, getTables } from "@/lib/api";
import type { TableContentResponse, TablesResponse, WhatsAppResponse } from "@/lib/types";

// Every hook reads through `lib/api.ts`, which in turn drives the in-browser
// PoS simulator from `lib/pos/`.

const defaultConfig = {
  revalidateOnFocus: false,
  shouldRetryOnError: false
} satisfies SWRConfiguration;

export function useTableDetail(
  tableId: number,
  config?: SWRConfiguration<TableContentResponse>
) {
  return useSWR<TableContentResponse>(
    Number.isFinite(tableId) ? ["table-detail", tableId] : null,
    () => getTable(tableId),
    { ...defaultConfig, ...config, keepPreviousData: true }
  );
}

export function useTableMessage(
  tableId: number,
  config?: SWRConfiguration<WhatsAppResponse>
) {
  return useSWR<WhatsAppResponse>(
    Number.isFinite(tableId) ? ["table-message", tableId] : null,
    () => getTableMessage(tableId),
    { ...defaultConfig, ...config }
  );
}

export function useTablesList(
  page: number,
  pageSize: number,
  config?: SWRConfiguration<TablesResponse>
) {
  return useSWR<TablesResponse>(
    Number.isFinite(page) && Number.isFinite(pageSize) && page >= 1 && pageSize >= 1
      ? ["tables-list", page, pageSize]
      : null,
    () => getTables({ page, pageSize }),
    { ...defaultConfig, ...config, keepPreviousData: true }
  );
}

