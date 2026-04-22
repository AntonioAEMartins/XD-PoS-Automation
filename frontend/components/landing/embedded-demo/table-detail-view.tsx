"use client";

import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { postCloseTable, postPrebill } from "@/lib/api";
import { useTableDetail, useTableMessage } from "@/lib/client-api";
import type { WireTrace } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

import { StatusPill } from "./status-pill";
import { WireTail } from "./wire-tail";

type TableDetailViewProps = {
  tableId: number;
  onBack: () => void;
};

export function TableDetailView({ tableId, onBack }: TableDetailViewProps) {
  const { toast } = useToast();
  const [lastTrace, setLastTrace] = useState<WireTrace | undefined>();
  const [lastLabel, setLastLabel] = useState<string>("POSTQUEUE");
  const [isPending, startTransition] = useTransition();

  const {
    data: detailData,
    error: detailError,
    isLoading: detailLoading
  } = useTableDetail(tableId);
  const {
    data: messageData,
    error: messageError,
    isLoading: messageLoading
  } = useTableMessage(tableId);

  const table = detailData?.table;
  const detailErrorMessage = detailError
    ? detailError instanceof Error
      ? detailError.message
      : "Failed to load table."
    : null;
  const messageErrorMessage = messageError
    ? messageError instanceof Error
      ? messageError.message
      : "Failed to load message."
    : null;

  const showMessageSkeleton = messageLoading && !messageData;
  const showHeaderSkeleton = detailLoading && !detailData;

  const triggerAction = (action: "prebill" | "close") => {
    startTransition(async () => {
      try {
        const result =
          action === "prebill"
            ? await postPrebill(tableId)
            : await postCloseTable(tableId);
        setLastTrace(result.wire_trace);
        setLastLabel(action === "prebill" ? "POSTQUEUE (pre-bill)" : "POSTQUEUE (close)");
        toast({
          title: action === "prebill" ? "Pre-bill requested" : "Close command sent",
          description:
            result.result ?? "The wire trace below shows the latest exchange."
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
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to tables
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {showHeaderSkeleton ? (
            <span
              className="h-6 w-16 animate-pulse rounded-full bg-white/[0.04]"
              aria-hidden
            />
          ) : (
            <span className="text-sm font-semibold text-foreground">
              #{table?.name ?? tableId}
            </span>
          )}
          <StatusPill status={table?.status} />
          {typeof table?.total === "number" && (
            <span className="mono text-[12px] text-muted-foreground">
              {formatCurrency(table.total)}
            </span>
          )}
        </div>
      </div>

      {detailErrorMessage && !table && (
        <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-destructive/90">
          {detailErrorMessage}
        </p>
      )}

      <div>
        <p className="eyebrow mb-2">WhatsApp message</p>
        {showMessageSkeleton ? (
          <div
            className="h-32 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
            aria-hidden
          />
        ) : messageErrorMessage ? (
          <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-destructive/90">
            {messageErrorMessage}
          </p>
        ) : (
          <pre className="mono whitespace-pre-wrap rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[12.5px] leading-relaxed text-foreground/85">
            {messageData?.message ?? "Message not available right now."}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => triggerAction("prebill")}
          disabled={isPending}
          className={cn(
            "glass rounded-full px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          )}
        >
          Request pre-bill
        </button>
        <button
          type="button"
          onClick={() => triggerAction("close")}
          disabled={isPending}
          className={cn(
            "glass rounded-full px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          )}
        >
          Close table
        </button>
        {isPending && (
          <span className="mono text-[11px] text-muted-foreground">
            Sending command...
          </span>
        )}
      </div>

      <WireTail trace={lastTrace} label={lastLabel} />
    </div>
  );
}
