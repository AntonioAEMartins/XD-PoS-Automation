// Ports src/services/table_cache.py:77-134 (pagination + summary helpers).

import type { PaginationMeta, Table, TableSummary } from "@/lib/types";

export function summarizeTables(tables: readonly Table[]): TableSummary {
  let open = 0;
  let closing = 0;
  let free = 0;
  for (const t of tables) {
    if (t.status === 1) open += 1;
    else if (t.status === 2) closing += 1;
    else if (t.status === 0) free += 1;
  }
  return { total: tables.length, open, closing, free };
}

export function paginateTables(
  tables: readonly Table[],
  page?: number,
  pageSize?: number,
): { tables: Table[]; pagination?: PaginationMeta } {
  if (page === undefined && pageSize === undefined) {
    return { tables: [...tables] };
  }
  if ((page === undefined) !== (pageSize === undefined)) {
    throw new Error(
      "Both page and page_size must be provided to enable pagination.",
    );
  }

  const p = page as number;
  const size = pageSize as number;
  if (p <= 0 || size <= 0) {
    throw new Error("page and page_size must be positive integers.");
  }

  const totalItems = tables.length;
  const totalPages = totalItems
    ? Math.max(1, Math.ceil(totalItems / size))
    : 1;
  const startIndex = (p - 1) * size;

  if (totalItems && startIndex >= totalItems) {
    throw new Error("Requested page is out of range.");
  }

  const endIndex = Math.min(startIndex + size, totalItems);
  const visible = tables.slice(startIndex, endIndex);

  const pagination: PaginationMeta = {
    page: p,
    page_size: size,
    total_items: totalItems,
    total_pages: totalPages,
    has_previous: p > 1 && totalItems > 0,
    has_next: p < totalPages && totalItems > 0,
    start_index: totalItems ? startIndex + 1 : 0,
    end_index: totalItems ? endIndex : 0,
  };

  return { tables: [...visible], pagination };
}
