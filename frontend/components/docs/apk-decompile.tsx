"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ApkAnnotation = {
  /** Human-readable annotation copy for the right column. */
  text: string;
  /** 1-indexed line numbers in the `obfuscated` array that this annotation explains. */
  highlightLines: number[];
  /** Optional short label that shows up above the annotation body. */
  label?: string;
};

type ApkDecompileProps = {
  obfuscated: string[];
  annotated: ApkAnnotation[];
  /**
   * Initial collapsed height (px). Full height is revealed on `Show more`.
   */
  collapsedHeight?: number;
  className?: string;
  title?: string;
};

/**
 * Two-column side-by-side reader for "what fell out of the APK".
 *
 * Left column: synthetic Smali/Java-looking decompile (obfuscated).
 * Right column: annotated, human-readable version.
 *
 * Hovering an annotation on the right highlights the corresponding
 * line numbers on the left. Scroll is synchronized between columns
 * so a long method on the left lines up with its explanation.
 */
export function ApkDecompile({
  obfuscated,
  annotated,
  collapsedHeight = 280,
  className,
  title = "Decompiled module"
}: ApkDecompileProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  const highlightedLines = useMemo(() => {
    if (hovered === null) return new Set<number>();
    return new Set(annotated[hovered]?.highlightLines ?? []);
  }, [hovered, annotated]);

  const handleLeftScroll = useCallback(() => {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    const left = leftRef.current;
    const right = rightRef.current;
    const ratio = left.scrollTop / Math.max(1, left.scrollHeight - left.clientHeight);
    right.scrollTop = ratio * Math.max(0, right.scrollHeight - right.clientHeight);
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    const left = leftRef.current;
    const right = rightRef.current;
    const ratio = right.scrollTop / Math.max(1, right.scrollHeight - right.clientHeight);
    left.scrollTop = ratio * Math.max(0, left.scrollHeight - left.clientHeight);
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const style = expanded ? undefined : { maxHeight: `${collapsedHeight}px` };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 shadow-sm backdrop-blur",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">
            Hover an annotation to highlight the matching lines on the left.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" aria-hidden /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" aria-hidden /> Show more
            </>
          )}
        </Button>
      </header>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <div
          ref={leftRef}
          onScroll={handleLeftScroll}
          style={style}
          className={cn(
            "relative overflow-y-auto rounded-xl border bg-slate-950 text-slate-50 shadow-inner",
            "scrollbar-thin"
          )}
          aria-label="Obfuscated decompiled source"
        >
          <pre className="mono m-0 min-h-full p-3 text-[11.5px] leading-6">
            {obfuscated.map((line, idx) => {
              const lineNumber = idx + 1;
              const isHot = highlightedLines.has(lineNumber);
              return (
                <span
                  key={`${lineNumber}-${line}`}
                  className={cn(
                    "block rounded px-1 transition-colors",
                    isHot && "bg-primary/25 text-primary-foreground/95"
                  )}
                >
                  <span className="mr-3 select-none text-slate-500">
                    {String(lineNumber).padStart(2, "0")}
                  </span>
                  {line || " "}
                </span>
              );
            })}
          </pre>
        </div>

        <div
          ref={rightRef}
          onScroll={handleRightScroll}
          style={style}
          className="overflow-y-auto rounded-xl border bg-background"
          aria-label="Annotated explanation"
        >
          <ol className="divide-y">
            {annotated.map((item, idx) => {
              const isActive = hovered === idx;
              return (
                <li
                  key={`${idx}-${item.text.slice(0, 24)}`}
                  onMouseEnter={() => setHovered(idx)}
                  onFocus={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  className={cn(
                    "group cursor-default px-4 py-3 text-sm outline-none transition-colors",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/85 hover:bg-muted/60 focus-visible:bg-muted/60"
                  )}
                >
                  {item.label ? (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </div>
                  ) : null}
                  <p className="mt-0.5">{item.text}</p>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Lines {item.highlightLines.join(", ")}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

const DEMO_OBFUSCATED: string[] = [
  ".class public Lcom/vendor/pos/a/b/c/Xd$a;",
  ".super Ljava/lang/Object;",
  "",
  "# instance fields",
  ".field private a:Ljava/lang/String; # device-uuid",
  ".field private b:Ljava/lang/String; # session-token",
  ".field private c:I              # port = 10401",
  "",
  ".method public a(Ljava/lang/String;)Ljava/lang/String;",
  "    .locals 3",
  "    const-string v0, \"[NP]OP=\"",
  "    invoke-virtual {v0, p1}, Ljava/lang/String;->concat(...)",
  "    move-result-object v1",
  "    const-string v2, \"[EOM]\"",
  "    invoke-virtual {v1, v2}, Ljava/lang/String;->concat(...)",
  "    move-result-object v1",
  "    return-object v1",
  ".end method",
  "",
  ".method private b()V",
  "    new-instance v0, Ljava/net/Socket;",
  "    iget v1, p0, Lcom/vendor/pos/a/b/c/Xd$a;->c:I",
  "    const-string v2, \"10.0.0.23\"",
  "    invoke-direct {v0, v2, v1}, Ljava/net/Socket;-><init>(Ljava/lang/String;I)V",
  "    return-void",
  ".end method"
];

const DEMO_ANNOTATIONS: ApkAnnotation[] = [
  {
    label: "Identity",
    text:
      "The vendor caches a device UUID and a session token on disk — that's the only state you need to look like a real handheld.",
    highlightLines: [5, 6]
  },
  {
    label: "Transport",
    text:
      "Hard-coded port 10401 for the in-store PDV. There's no fallback, no TLS, no service discovery.",
    highlightLines: [7, 22, 23]
  },
  {
    label: "Protocol",
    text:
      "The request builder is comically literal: prepend `[NP]OP=` and append `[EOM]`. Every command in the app reuses this helper.",
    highlightLines: [9, 10, 11, 12, 13, 14, 15, 16]
  },
  {
    label: "Socket",
    text:
      "A raw `java.net.Socket` opens a plain TCP connection to a LAN IP. Once we know the UUID and token, we can open the same socket ourselves.",
    highlightLines: [20, 21, 22, 23, 24]
  }
];

export function ApkDecompileDemo() {
  return (
    <ApkDecompile
      title="Demo: synthetic module from the handheld APK"
      obfuscated={DEMO_OBFUSCATED}
      annotated={DEMO_ANNOTATIONS}
    />
  );
}
