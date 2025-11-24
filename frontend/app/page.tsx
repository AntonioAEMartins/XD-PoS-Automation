import Link from "next/link";
import { AlertTriangle, ArrowRight, Satellite, Zap } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { WireViewer } from "@/components/wire-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTables } from "@/lib/api";
import type { Table as TableModel } from "@/lib/types";

type LinkHref = Parameters<typeof Link>[0]["href"];

const PAGE_SIZE = 10;

export default async function HomePage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const rawPageParam = searchParams?.page;
  const normalizedPageParam = Array.isArray(rawPageParam) ? rawPageParam[0] : rawPageParam;
  const parsedPage = Number.parseInt(normalizedPageParam ?? "1", 10);
  const requestedPage = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  let tablesPayload = null;
  let error: string | null = null;

  try {
    tablesPayload = await getTables({ page: requestedPage, pageSize: PAGE_SIZE });
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Unable to load tables.";
  }

  const tables: TableModel[] = tablesPayload?.tables ?? [];
  const wireTrace = tablesPayload?.wire_trace;
  const summary =
    tablesPayload?.summary ??
    {
      total: tables.length,
      open: tables.filter(t => t.status === 1).length,
      closing: tables.filter(t => t.status === 2).length,
      free: tables.filter(t => t.status === 0).length
    };
  const pagination = tablesPayload?.pagination;
  const currentPage = pagination?.page ?? requestedPage;
  const totalPages = pagination?.total_pages ?? Math.max(1, summary.total ? Math.ceil(summary.total / PAGE_SIZE) : 1);
  const showingStart = pagination?.start_index ?? (tables.length ? 1 : 0);
  const showingEnd = pagination?.end_index ?? tables.length;
  const totalCount = pagination?.total_items ?? summary.total;

  const createPageHref = (targetPage: number): LinkHref => {
    const query: Record<string, string | string[]> = {};

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (key === "page" || value == null) {
          return;
        }
        query[key] = value;
      });
    }

    query.page = String(targetPage);

    return {
      pathname: "/",
      query
    };
  };

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
          <span>API base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}</span>
        </div>
      </header>

      {error ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Failed to load</CardTitle>
              <CardDescription>{error}</CardDescription>
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
                    {tables.length === 0 ? (
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
                  {tables.length === 0
                    ? "No tables to display."
                    : `Showing ${showingStart}-${showingEnd} of ${totalCount} tables`}
                </p>
                {pagination && tables.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <PaginationButton
                      label="Previous"
                      disabled={!pagination.has_previous}
                      href={createPageHref(Math.max(1, currentPage - 1))}
                    />
                    <span className="font-medium text-slate-900">{`Page ${currentPage} of ${totalPages}`}</span>
                    <PaginationButton
                      label="Next"
                      disabled={!pagination.has_next}
                      href={createPageHref(Math.min(totalPages, currentPage + 1))}
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

function PaginationButton({
  label,
  href,
  disabled
}: {
  label: string;
  href: LinkHref;
  disabled: boolean;
}) {
  const baseClass =
    "inline-flex items-center rounded-full border px-3 py-1 font-medium transition-colors";

  if (disabled) {
    return <span className={`${baseClass} cursor-not-allowed border-dashed opacity-50`}>{label}</span>;
  }

  return (
    <Link href={href} className={`${baseClass} border-primary text-primary hover:bg-primary/10`}>
      {label}
    </Link>
  );
}
