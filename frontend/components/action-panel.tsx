"use client";

import { useState, useTransition } from "react";

import { postCloseTable, postPrebill } from "@/lib/api";
import { TableStatus, WireTrace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { WireViewer } from "@/components/wire-viewer";

type ActionPanelProps = {
  tableId: number;
  status?: TableStatus;
  className?: string;
};

const STATUS_LABELS: Record<number, string> = {
  0: "Available",
  1: "In service",
  2: "Closing"
};

export function ActionPanel({ tableId, status, className }: ActionPanelProps) {
  const { toast } = useToast();
  const [lastTrace, setLastTrace] = useState<WireTrace | undefined>();
  const [isPending, startTransition] = useTransition();

  const triggerAction = (action: "prebill" | "close") => {
    startTransition(async () => {
      try {
        const result =
          action === "prebill"
            ? await postPrebill(tableId)
            : await postCloseTable(tableId);
        setLastTrace(result.wire_trace);
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
        <Button
          onClick={() => triggerAction("prebill")}
          disabled={isPending}
          className="shadow-lg"
        >
          Request pre-bill
        </Button>
        <Button
          onClick={() => triggerAction("close")}
          disabled={isPending}
          variant="secondary"
          className="shadow-lg"
        >
          Close table
        </Button>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Current status:{" "}
            {typeof status === "number"
              ? STATUS_LABELS[Number(status)] ?? `Status ${status}`
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
        />
      )}
    </div>
  );
}
