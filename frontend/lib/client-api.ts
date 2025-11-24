"use client";

import useSWR, { type SWRConfiguration } from "swr";

import { getTable, getTableMessage, getTables } from "@/lib/api";
import type {
  TableContentResponse,
  TablesResponse,
  WhatsAppResponse
} from "@/lib/types";

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

export function useTablesList(
  page: number = 1,
  pageSize: number = 10,
  config?: SWRConfiguration<TablesResponse>
) {
  return useSWR<TablesResponse>(
    ["tables-list", page, pageSize],
    () => getTables({ page, pageSize }),
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

