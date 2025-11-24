"use client";

import { useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTableDetail } from "@/lib/client-api";
import type { TableStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { TableActionsCard } from "./table-actions-card";
import { TableItemsPanel } from "./table-items-panel";
import { WhatsAppMessageCard } from "./whatsapp-message-card";
import type { TableDetailQueryState } from "./types";

type TableDetailClientProps = {
  tableId: number;
};

export function TableDetailClient({ tableId }: TableDetailClientProps) {
  const tableQuery = useTableDetail(tableId);
  const { data, error, isLoading, mutate } = tableQuery;
  const table = data?.table;
  const normalizedError =
    error instanceof Error
      ? error
      : error
        ? new Error(typeof error === "string" ? error : "Failed to load table.")
        : undefined;

  const queryState: TableDetailQueryState = {
    data,
    error: normalizedError,
    isLoading,
    mutate
  };

  const [displayStatus, setDisplayStatus] = useState<TableStatus | undefined>(
    table?.status
  );

  useEffect(() => {
    setDisplayStatus(table?.status);
  }, [table?.status]);

  return (
    <section className="space-y-6">
      <Card className="border border-border/80 bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Table #{table?.name ?? tableId}
            </p>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {table?.tableLocation ?? "Unknown location"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {table
                  ? `Current total ${formatCurrency(table.total)}`
                  : "Waiting for PoS sync..."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={displayStatus ?? table?.status} />
          </div>
        </div>
        {normalizedError && !table && (
          <div className="flex items-center gap-2 border-t border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>
              {normalizedError.message || "Failed to load table data."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              className="ml-auto"
            >
              Try again
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <TableItemsPanel query={queryState} />
        <WhatsAppMessageCard tableId={tableId} />
      </div>

      <TableActionsCard
        tableId={tableId}
        tableStatus={displayStatus ?? table?.status}
        wireTrace={data?.wire_trace}
        query={queryState}
        onStatusChange={(status) => setDisplayStatus(status)}
      />
    </section>
  );
}

