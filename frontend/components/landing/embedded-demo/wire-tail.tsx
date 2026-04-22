"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { WireViewer } from "@/components/wire-viewer";
import type { WireTrace } from "@/lib/types";
import { cn } from "@/lib/utils";

type WireTailProps = {
  trace?: WireTrace;
  label?: string;
};

function byteLength(raw: string | undefined): number {
  if (!raw) return 0;
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(raw).length;
  }
  return raw.length;
}

export function WireTail({ trace, label = "POSTQUEUE" }: WireTailProps) {
  const [expanded, setExpanded] = useState(false);

  if (!trace) return null;

  const size = byteLength(trace.request?.raw);
  const summary = `${label} → POSTQUEUERESULT OK · ${size} B`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-controls="wire-tail-panel"
        className="glass mono flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[12px] text-foreground/80 transition-colors hover:bg-white/[0.05]"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div
          id="wire-tail-panel"
          className="overflow-hidden rounded-xl bg-white/[0.02]"
        >
          <WireViewer
            trace={trace}
            viewerId="embedded-demo-wire"
            title="Wire trace"
            className="border-none shadow-none"
          />
        </div>
      )}
    </div>
  );
}
