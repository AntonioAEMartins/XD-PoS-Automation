"use client";

import { useEffect, useMemo, useState } from "react";
import { Code2, SplitSquareVertical } from "lucide-react";

import { WireTrace } from "@/lib/types";
import { getPosMessage } from "@/lib/wire-trace";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FormatOption = "raw" | "base64" | "ascii";
type TraceSide = "request" | "response" | "pos";

type WireViewerProps = {
  trace?: WireTrace;
  viewerId?: string;
  className?: string;
  title?: string;
  showPosTab?: boolean;
};

function safeBase64(value: string | undefined) {
  if (!value) return "—";
  try {
    if (typeof window === "undefined") {
      return Buffer.from(value, "utf-8").toString("base64");
    }
    return btoa(unescape(encodeURIComponent(value)));
  } catch (error) {
    return `Unable to encode: ${String(error)}`;
  }
}

export function WireViewer({
  trace,
  viewerId = "wire-viewer",
  className,
  title = "Wire trace",
  showPosTab = true
}: WireViewerProps) {
  const [format, setFormat] = useState<FormatOption>("raw");
  const [side, setSide] = useState<TraceSide>("request");
  const posMessage = useMemo(() => getPosMessage(trace), [trace]);

  useEffect(() => {
    if (!showPosTab && side === "pos") {
      setSide("request");
    }
  }, [showPosTab, side]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(`${viewerId}-format`) as
      | FormatOption
      | null;
    if (saved) setFormat(saved);
  }, [viewerId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`${viewerId}-format`, format);
  }, [format, viewerId]);

  const selectedContent = useMemo(() => {
    const requestSlice = {
      raw: trace?.request?.raw,
      ascii: trace?.request?.ascii,
      empty: "Request trace unavailable."
    };
    const responseSlice = {
      raw: trace?.response?.raw,
      ascii: trace?.response?.ascii,
      empty: "Response trace unavailable."
    };
    const posSlice = {
      raw: posMessage,
      ascii: posMessage,
      empty: "PoS message unavailable."
    };

    switch (side) {
      case "response":
        return responseSlice;
      case "pos":
        return posSlice;
      case "request":
      default:
        return requestSlice;
    }
  }, [side, posMessage, trace?.request?.ascii, trace?.request?.raw, trace?.response?.ascii, trace?.response?.raw]);

  const formattedContent = useMemo(() => {
    if (!selectedContent.raw) {
      return selectedContent.empty;
    }

    switch (format) {
      case "raw":
        return selectedContent.raw;
      case "ascii":
        return selectedContent.ascii ?? selectedContent.raw;
      case "base64":
        return safeBase64(selectedContent.raw);
      default:
        return selectedContent.raw;
    }
  }, [format, selectedContent]);

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Code2 className="h-4 w-4 text-primary" />
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SplitSquareVertical className="h-4 w-4" />
          <span>{trace ? "Live TCP snapshot" : "Waiting for data"}</span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={side}
            onValueChange={value => setSide(value as TraceSide)}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              {showPosTab && <TabsTrigger value="pos">PoS</TabsTrigger>}
            </TabsList>
          </Tabs>

          <ToggleGroup
            type="single"
            value={format}
            onValueChange={value => {
              if (value) setFormat(value as FormatOption);
            }}
            className="rounded-md bg-muted/80 p-1"
          >
            <ToggleGroupItem value="raw">Raw</ToggleGroupItem>
            <ToggleGroupItem value="base64">Base64</ToggleGroupItem>
            <ToggleGroupItem value="ascii">ASCII</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="rounded-lg border bg-slate-950/90 p-3 text-xs text-slate-50 shadow-inner">
          <pre className="mono whitespace-pre-wrap break-words leading-6">
            {formattedContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
