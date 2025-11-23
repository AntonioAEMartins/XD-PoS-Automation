"use client";

import useSWR, { type SWRConfiguration } from "swr";

import { getTable, getTableMessage } from "@/lib/api";
import type { TableContentResponse, WhatsAppResponse } from "@/lib/types";

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

