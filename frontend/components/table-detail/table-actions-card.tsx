"use client";

import { AlertCircle, Loader2, ReceiptText } from "lucide-react";

import { ActionPanel } from "@/components/action-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WireViewer } from "@/components/wire-viewer";
import type { TableStatus, WireTrace } from "@/lib/types";

import type { TableDetailQueryState } from "./types";

type TableActionsCardProps = {
  tableId: number;
  tableStatus?: TableStatus;
  wireTrace?: WireTrace;
  query: TableDetailQueryState;
  onStatusChange?: (status: TableStatus) => void;
};

export function TableActionsCard({
  tableId,
  tableStatus,
  wireTrace,
  query,
  onStatusChange
}: TableActionsCardProps) {
  const isLoading = query.isLoading && !wireTrace;
  const showError = !!query.error && !wireTrace;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Actions & trace
          </CardTitle>
          <CardDescription>
            Trigger the pre-bill or close command and monitor the live trace.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActionPanel
          tableId={tableId}
          status={tableStatus}
          onRefresh={() => query.mutate()}
          onStatusChange={onStatusChange}
        />

        {isLoading && <Skeleton className="h-48 w-full rounded-xl" />}
        {showError && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load the wire trace.</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => query.mutate()}
              className="text-destructive"
            >
              Try again
            </Button>
          </div>
        )}

        {wireTrace && (
          <WireViewer
            trace={wireTrace}
            viewerId={`table-wire-${tableId}`}
            title="Wire trace (table content)"
            className="shadow-none"
            showPosTab={false}
          />
        )}
      </CardContent>
    </Card>
  );
}

