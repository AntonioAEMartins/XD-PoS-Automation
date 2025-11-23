import {
  ActionResponse,
  TableContentResponse,
  TablesResponse,
  WhatsAppResponse
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = typeof payload.detail === "string" ? payload.detail : message;
    } catch {
      try {
        message = await response.text();
      } catch {
        // ignore parsing errors
      }
    }
    throw new Error(`Request to ${path} failed: ${message}`);
  }

  return response.json() as Promise<T>;
}

export type GetTablesParams = {
  page?: number;
  pageSize?: number;
};

export async function getTables(params?: GetTablesParams): Promise<TablesResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.pageSize !== undefined) {
    searchParams.set("page_size", String(params.pageSize));
  }

  const query = searchParams.toString();
  const path = query ? `/frontend/tables?${query}` : "/frontend/tables";

  return apiFetch<TablesResponse>(path);
}

export async function getTable(
  tableId: number | string
): Promise<TableContentResponse> {
  return apiFetch<TableContentResponse>(`/frontend/tables/${tableId}`);
}

export async function postPrebill(
  tableId: number | string
): Promise<ActionResponse> {
  return apiFetch<ActionResponse>(`/frontend/tables/${tableId}/prebill`, {
    method: "POST"
  });
}

export async function postCloseTable(
  tableId: number | string
): Promise<ActionResponse> {
  return apiFetch<ActionResponse>(`/frontend/tables/${tableId}/close`, {
    method: "POST"
  });
}

export async function getTableMessage(
  tableId: number | string
): Promise<WhatsAppResponse> {
  return apiFetch<WhatsAppResponse>(`/tables/${tableId}/message/`);
}
