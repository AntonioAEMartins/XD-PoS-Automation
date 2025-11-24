"use client";

import { useEffect, useState, useTransition } from "react";
import { mutate } from "swr";

import { postCloseTable, postPrebill } from "@/lib/api";
import { TableStatus, TablesResponse, WireTrace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { WireViewer } from "@/components/wire-viewer";

type ActionPanelProps = {
  tableId: number;
  status?: TableStatus;
  className?: string;
  onRefresh?: () => Promise<unknown> | unknown;
  onStatusChange?: (status: TableStatus) => void;
};

const STATUS_LABELS: Record<number, string> = {
  0: "Available",
  1: "In service",
  2: "Closing",
  3: "Payment pending",
  4: "Closed"
};

export function ActionPanel({
  tableId,
  status,
  className,
  onRefresh,
  onStatusChange
}: ActionPanelProps) {
  const { toast } = useToast();
  const [lastTrace, setLastTrace] = useState<WireTrace | undefined>();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<TableStatus | undefined>(status);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const normalizedStatus =
    typeof currentStatus === "number" ? Number(currentStatus) : undefined;
  const isInService = normalizedStatus === 1;
  const isPaymentPending = normalizedStatus === 3;
  const isClosed = normalizedStatus === 4;
  const canRequestPrebill = isInService;
  const canCloseTable = normalizedStatus === 1 || normalizedStatus === 3;
  const showActions =
    normalizedStatus == null ? true : isInService || isPaymentPending;
  const disablePrebill =
    isPending || !canRequestPrebill || isPaymentPending || isClosed;
  const disableClose = isPending || !canCloseTable || isClosed;

  const triggerAction = (action: "prebill" | "close") => {
    if ((action === "prebill" && disablePrebill) || (action === "close" && disableClose)) {
      return;
    }

    startTransition(async () => {
      try {
        const result =
          action === "prebill"
            ? await postPrebill(tableId)
            : await postCloseTable(tableId);
        setLastTrace(result.wire_trace);
        const updatedStatus = action === "prebill" ? 3 : 4;
        setCurrentStatus(updatedStatus);
        onStatusChange?.(updatedStatus);
        syncTablesListCache(tableId, updatedStatus);
        await onRefresh?.();
        toast({
          title: action === "prebill" ? "Pre-bill requested" : "Close command sent",
          description: result.result ?? "The panel below shows the latest message exchange."
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to perform the action.";
        toast({
          title: "Action failed",
          description: message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {showActions && (
          <>
            <Button
              onClick={() => triggerAction("prebill")}
              disabled={disablePrebill}
              className="shadow-lg"
            >
              Request pre-bill
            </Button>
            <Button
              onClick={() => triggerAction("close")}
              disabled={disableClose}
              variant="secondary"
              className="shadow-lg"
            >
              Close table
            </Button>
          </>
        )}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Current status:{" "}
            {normalizedStatus != null
              ? STATUS_LABELS[normalizedStatus] ?? `Status ${normalizedStatus}`
              : "Loading..."}
          </p>
          {isPending && <span>Sending commands...</span>}
        </div>
      </div>

      {lastTrace && (
        <WireViewer
          trace={lastTrace}
          viewerId={`action-trace-${tableId}`}
          title="Last action"
          showPosTab={false}
        />
      )}
    </div>
  );
}

function syncTablesListCache(tableId: number, nextStatus: TableStatus) {
  mutate(
    key => Array.isArray(key) && key[0] === "tables-list",
    (data?: TablesResponse) => {
      if (!data) {
        return data;
      }

      const targetTable = data.tables.find(table => table.id === tableId);
      if (!targetTable || targetTable.status === nextStatus) {
        return data;
      }

      const updatedTables = data.tables.map(table =>
        table.id === tableId ? { ...table, status: nextStatus } : table
      );

      return {
        ...data,
        tables: updatedTables,
        summary: adjustSummaryCounts(data.summary, targetTable.status, nextStatus)
      };
    },
    { revalidate: false }
  );
}

function adjustSummaryCounts(
  summary: TablesResponse["summary"],
  previousStatus: TableStatus,
  nextStatus: TableStatus
) {
  if (!summary) {
    return summary;
  }

  const nextSummary = { ...summary };

  decrementStatusCount(nextSummary, previousStatus);
  incrementStatusCount(nextSummary, nextStatus);

  return nextSummary;
}

function decrementStatusCount(summary: TablesResponse["summary"], status: TableStatus) {
  if (status === 0) {
    summary.free = Math.max(0, summary.free - 1);
  } else if (status === 1) {
    summary.open = Math.max(0, summary.open - 1);
  } else if (status === 2) {
    summary.closing = Math.max(0, summary.closing - 1);
  }
}

function incrementStatusCount(summary: TablesResponse["summary"], status: TableStatus) {
  if (status === 0) {
    summary.free += 1;
  } else if (status === 1) {
    summary.open += 1;
  } else if (status === 2) {
    summary.closing += 1;
  }
}
