"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Satellite, Zap } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { WireViewer } from "@/components/wire-viewer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useTablesList } from "@/lib/client-api";
import type { Table as TableModel, TablesResponse } from "@/lib/types";

const PAGE_SIZE = 10;

type TablesListClientProps = {
  initialPage?: number;
};

export function TablesListClient({ initialPage = 1 }: TablesListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString();

  const normalizedInitialPage = sanitizePage(initialPage);
  const [page, setPage] = useState<number>(normalizedInitialPage);

  const searchPage = useMemo(
    () => sanitizePage(searchParams?.get("page")),
    [searchParamsString]
  );

  useEffect(() => {
    if (searchPage !== page) {
      setPage(searchPage);
    }
  }, [searchPage, page]);

  const tablesQuery = useTablesList(page, PAGE_SIZE);
  const { data, error, isLoading } = tablesQuery;

  const tables: TableModel[] = data?.tables ?? [];
  const wireTrace = data?.wire_trace;
  const summary = useMemo(() => deriveSummary(data, tables), [data, tables]);
  const pagination = data?.pagination;
  const currentPage = pagination?.page ?? page;
  const totalPages =
    pagination?.total_pages ??
    Math.max(1, summary.total ? Math.ceil(summary.total / PAGE_SIZE) : 1);
  const showingStart =
    pagination?.start_index ?? (tables.length ? 1 + PAGE_SIZE * (currentPage - 1) : 0);
  const showingEnd =
    pagination?.end_index ??
    (tables.length ? showingStart + tables.length - 1 : 0);
  const totalCount = pagination?.total_items ?? summary.total;

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Unable to load tables."
        : null;

  const handlePageChange = useCallback(
    (targetPage: number) => {
      const nextPage = sanitizePage(targetPage);
      if (nextPage === page) {
        return;
      }
      setPage(nextPage);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(
          searchParamsString ?? ""
        );
        if (nextPage <= 1) {
          params.delete("page");
        } else {
          params.set("page", String(nextPage));
        }
        const queryString = params.toString();
        router.replace(
          queryString ? `${pathname}?${queryString}` : pathname,
          { scroll: false }
        );
      }
    },
    [page, pathname, router, searchParamsString]
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 lg:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Table & TCP Message Monitoring
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review table states, trigger pre-bills or closing actions, and inspect the raw PoS traffic.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs shadow-sm ring-1 ring-border">
          <Satellite className="h-4 w-4 text-primary" />
          <span>
            API base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}
          </span>
        </div>
      </header>

      {errorMessage ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Failed to load</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ensure the backend is running at {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"} and try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tables</CardTitle>
                  <CardDescription>
                    Pick a table to inspect details, WhatsApp message, and available actions.
                  </CardDescription>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Zap className="h-4 w-4" />
                  Real-time data
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Table</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Available?</TableHead>
                      <TableHead className="hidden sm:table-cell">User</TableHead>
                      <TableHead className="w-32 text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          Loading tables...
                        </TableCell>
                      </TableRow>
                    ) : tables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          No tables available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tables.map(table => (
                        <TableRow key={table.id}>
                          <TableCell className="font-semibold">#{table.name}</TableCell>
                          <TableCell>
                            <StatusBadge status={table.status} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {table.freeTable ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                            {table.initialUser}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-primary">
                            <Link
                              href={`/tables/${table.id}`}
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-primary/10"
                            >
                              Open <ArrowRight className="h-4 w-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {tables.length === 0 && !isLoading
                    ? "No tables to display."
                    : `Showing ${showingStart}-${showingEnd} of ${totalCount} tables`}
                </p>
                {pagination && tables.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <PaginationButton
                      label="Previous"
                      disabled={!pagination.has_previous || isLoading}
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    />
                    <span className="font-medium text-slate-900">{`Page ${currentPage} of ${totalPages}`}</span>
                    <PaginationButton
                      label="Next"
                      disabled={!pagination.has_next || isLoading}
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {wireTrace && (
            <details className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-primary">
                View listing wire trace
                <span className="text-xs text-muted-foreground">(toggle)</span>
              </summary>
              <div className="border-t">
                <WireViewer
                  trace={wireTrace}
                  viewerId="list-wire-trace"
                  title="Wire trace (table listing)"
                  className="border-none shadow-none"
                  showPosTab={false}
                />
              </div>
            </details>
          )}
        </>
      )}
    </main>
  );
}

type PaginationButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

function PaginationButton({ label, disabled, onClick }: PaginationButtonProps) {
  const baseClass =
    "inline-flex items-center rounded-full border px-3 py-1 font-medium transition-colors";

  if (disabled) {
    return (
      <span className={`${baseClass} cursor-not-allowed border-dashed opacity-50`}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} border-primary text-primary hover:bg-primary/10`}
    >
      {label}
    </button>
  );
}

function sanitizePage(value: number | string | null | undefined) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function deriveSummary(
  data: TablesResponse | undefined,
  fallbackTables: TableModel[]
) {
  if (data?.summary) {
    return data.summary;
  }

  const totals = fallbackTables.reduce(
    (acc, table) => {
      acc.total += 1;
      if (table.status === 1) {
        acc.open += 1;
      } else if (table.status === 2) {
        acc.closing += 1;
      } else if (table.status === 0) {
        acc.free += 1;
      }
      return acc;
    },
    { total: 0, open: 0, closing: 0, free: 0 }
  );

  return totals;
}


