"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DECOMPILE_SNIPPETS,
  type DecompileSnippet,
} from "@/lib/decompile/snippets";

// Companion to <PacketInspector />. Three condensed Java snippets
// from the vendor's APK proving the credential trail behind the
// TOKEN that appears in Stage 2 of the inspector.

const KEYWORDS = new Set([
  "private",
  "final",
  "public",
  "static",
  "class",
  "void",
  "if",
  "else",
  "return",
  "new",
  "try",
  "catch",
  "throw",
  "int",
  "String",
]);

// Single-pass tokenizer: strings, line comments, then keywords. Order
// matters — a `//` inside a string literal must read as part of the
// string, not as a comment, so strings come first.
const TOKEN_RE =
  /("(?:[^"\\]|\\.)*")|(\/\/.*)|\b(private|final|public|static|class|void|if|else|return|new|try|catch|throw|int|String)\b/g;

function highlightLine(text: string): ReactNode[] {
  TOKEN_RE.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(
        <span key={`t-${key++}`} className="text-foreground/80">
          {text.slice(cursor, match.index)}
        </span>,
      );
    }
    if (match[1] !== undefined) {
      nodes.push(
        <span key={`s-${key++}`} className="text-emerald-300/90">
          {match[1]}
        </span>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <span key={`c-${key++}`} className="italic text-muted-foreground/70">
          {match[2]}
        </span>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <span key={`k-${key++}`} className="text-sky-300/90">
          {match[3]}
        </span>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    nodes.push(
      <span key={`t-${key++}`} className="text-foreground/80">
        {text.slice(cursor)}
      </span>,
    );
  }
  if (nodes.length === 0) {
    // A blank line still needs to occupy a row at the right line height.
    nodes.push(
      <span key="blank" className="text-foreground/80">
        {" "}
      </span>,
    );
  }
  return nodes;
}

function CodePane({ snippet }: { snippet: DecompileSnippet }) {
  const lines = snippet.code.split("\n");
  const highlighted = new Set(snippet.highlights.map(h => h.line));
  return (
    <div className="overflow-x-auto rounded-b-xl border border-t-0 border-white/5 bg-background/70 p-4">
      <pre className="mono min-w-max text-[11.5px] leading-6 text-foreground/85">
        {lines.map((line, i) => {
          const isHot = highlighted.has(i);
          return (
            <div
              key={i}
              className={
                isHot
                  ? "-ml-2 flex gap-4 border-l-2 border-amber-400/60 bg-amber-400/10 pl-2"
                  : "flex gap-4"
              }
            >
              <span className="w-8 shrink-0 select-none text-right text-muted-foreground/60">
                {snippet.startLine + i}
              </span>
              <span className="whitespace-pre">{highlightLine(line)}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export function DecompiledCode() {
  const [active, setActive] = useState<DecompileSnippet["id"]>(
    DECOMPILE_SNIPPETS[0].id,
  );
  const activeSnippet =
    DECOMPILE_SNIPPETS.find(s => s.id === active) ?? DECOMPILE_SNIPPETS[0];

  // Measure the active TabsContent's height so the wrapper can animate
  // between snippets instead of snapping. Radix hides inactive content
  // via display:none, so the inner div's height always reflects only
  // the visible snippet.
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setContentHeight(entry.contentRect.height);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Decompiled from the APK</p>
        <h3 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          Three files, one credential trail.
        </h3>
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Hard-coded constants, an OAuth handshake, the call that splices
          the result back into every TCP message. Three excerpts from the
          vendor&rsquo;s own source.
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={value => setActive(value as DecompileSnippet["id"])}
        className="mt-6"
      >
        {/* Terminal chrome — shows the active file's full path. */}
        <div className="flex items-center gap-3 rounded-t-xl border border-b-0 border-white/5 bg-background/40 px-3 py-2">
          <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          </div>
          <p className="mono truncate text-[11px] text-muted-foreground">
            {activeSnippet.fullPath}
          </p>
        </div>

        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border border-b-0 border-white/5 bg-background/40 p-0 px-2">
          {DECOMPILE_SNIPPETS.map(snippet => (
            <TabsTrigger
              key={snippet.id}
              value={snippet.id}
              className="mono shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-2 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground shadow-none transition-colors hover:text-foreground/80 data-[state=active]:border-amber-400 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {snippet.shortLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        <motion.div
          animate={{ height: contentHeight }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.28, ease: [0.32, 0.72, 0.24, 1] }
          }
          style={{ overflow: "hidden" }}
        >
          <div ref={measureRef}>
            {DECOMPILE_SNIPPETS.map(snippet => (
              <TabsContent
                key={snippet.id}
                value={snippet.id}
                className="mt-0 flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5 px-1 pt-3">
                  <p className="eyebrow">{snippet.caption.eyebrow}</p>
                  <p className="text-pretty text-[13.5px] leading-relaxed text-foreground/80">
                    {snippet.caption.body}
                  </p>
                  {snippet.caption.tertiary ? (
                    <p className="text-[11.5px] italic leading-relaxed text-muted-foreground">
                      {snippet.caption.tertiary}
                    </p>
                  ) : null}
                </div>
                <CodePane snippet={snippet} />
              </TabsContent>
            ))}
          </div>
        </motion.div>
      </Tabs>

      <p className="mt-6 text-[11.5px] leading-relaxed text-muted-foreground">
        <span className="mono break-all text-foreground/70">
          POST https://myxd1.azurewebsites.net/api/auth/login
        </span>
        {" "}&middot; same five form fields, same response, every time the
        handheld cold-starts.
      </p>
    </div>
  );
}
