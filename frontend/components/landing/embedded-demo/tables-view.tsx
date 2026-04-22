"use client";

import { ChevronRight } from "lucide-react";

import { useTablesList } from "@/lib/client-api";
import { cn } from "@/lib/utils";

import { StatusPill } from "./status-pill";

type TablesViewProps = {
  onSelect: (tableId: number) => void;
  page: number;
  onPageChange: (page: number) => void;
};

const PAGE_SIZE = 5;

export function TablesView({ onSelect, page, onPageChange }: TablesViewProps) {
  const { data, error, isLoading } = useTablesList(page, PAGE_SIZE);

  const tables = data?.tables ?? [];
  const pagination = data?.pagination;
  const hasPrevious = pagination?.has_previous ?? page > 1;
  const hasNext = pagination?.has_next ?? false;
  const totalPages = pagination?.total_pages ?? page;

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Unable to load tables."
    : null;

  const showSkeleton = isLoading && !data;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Tables</p>
        {pagination && (
          <span className="mono text-[11px] text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </span>
        )}
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-destructive/90">
          {errorMessage}
        </p>
      ) : showSkeleton ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
            <li
              key={idx}
              className="h-11 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]"
              aria-hidden
            />
          ))}
        </ul>
      ) : tables.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-4 text-center text-xs text-muted-foreground">
          No tables available.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tables.map(table => (
            <li key={table.id}>
              <button
                type="button"
                onClick={() => onSelect(table.id)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left text-[13px] transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                <span className="font-medium text-foreground">
                  #{table.name}
                </span>
                <StatusPill status={table.status} />
                <span className="mono ml-auto hidden text-[11px] text-muted-foreground sm:inline">
                  user {table.initialUser}
                </span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!hasPrevious || showSkeleton}
          className={cn(
            "glass rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/[0.08]",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          )}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || showSkeleton}
          className={cn(
            "glass rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/[0.08]",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
