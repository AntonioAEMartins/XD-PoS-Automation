"use client";

import { useCallback, useState, type MouseEvent, type ReactNode } from "react";

import prebillTrace from "@/lib/fixtures/prebill-trace-12.json";

// Four-stage horizontal pipeline. The HEX dump never wanted to be a
// square — it sits at the top as a thin proportional band, one segment
// per field, scaled by byte count. The three reading-friendly stages
// (ASCII / fields / action) sit below as flexible columns that grow to
// fit their content. Hover any element with [data-field] and matching
// elements anywhere in the panel light up.

const wire = prebillTrace.wire_trace;
const REQUEST_ASCII = wire.request.ascii;
const REQUEST_QUEUE = wire.payloads.request_queue;

// Delimiters — mirrors lib/pos/constants.ts (NP / EQ / EOM).
const NP = "[NP]";
const EQ = "[EQ]";
const EOM = "[EOM]";

type FieldKey =
  | "postqueue"
  | "version"
  | "queue"
  | "token"
  | "messagetype"
  | "messageid";

const FIELD_KEYS: FieldKey[] = [
  "postqueue",
  "version",
  "queue",
  "token",
  "messagetype",
  "messageid"
];

type FieldColor = "amber" | "sky" | "emerald" | "brand" | "slate";

const FIELD_COLOR: Record<FieldKey, FieldColor> = {
  postqueue: "amber",
  version: "slate",
  queue: "sky",
  token: "emerald",
  messagetype: "slate",
  messageid: "brand"
};

const FIELD_LABEL: Record<FieldKey, string> = {
  postqueue: "POSTQUEUE",
  version: "PROTOCOLVERSION",
  queue: "QUEUE",
  token: "TOKEN",
  messagetype: "MESSAGETYPE",
  messageid: "MESSAGEID"
};

// ── Field byte-range computation ───────────────────────────────────
// Each field's range covers its key prefix + delimiter + value, up to
// the next delimiter that closes the field. Indexes are in ASCII char
// units, which equal byte units (one ASCII char = one byte here).

function rangeBetween(after: string, until: string) {
  const start = REQUEST_ASCII.indexOf(after);
  if (start < 0) return null;
  const end = REQUEST_ASCII.indexOf(until, start + after.length);
  return { start, end: end < 0 ? REQUEST_ASCII.length : end };
}

const FIELD_RANGES: Record<
  FieldKey,
  { start: number; end: number } | null
> = {
  postqueue: { start: 0, end: "POSTQUEUE".length },
  version: rangeBetween("PROTOCOLVERSION", NP),
  queue: rangeBetween("QUEUE" + EQ, NP),
  token: rangeBetween("TOKEN" + EQ, NP),
  messagetype: rangeBetween("MESSAGETYPE" + EQ, NP),
  messageid: rangeBetween("MESSAGEID" + EQ, EOM)
};

function withKeyPrefix(key: FieldKey, prefix: string) {
  const r = FIELD_RANGES[key];
  if (!r) return;
  const i = REQUEST_ASCII.indexOf(prefix);
  if (i >= 0 && i < r.start) r.start = i;
}
withKeyPrefix("version", "PROTOCOLVERSION");
withKeyPrefix("queue", "QUEUE" + EQ);
withKeyPrefix("token", "TOKEN" + EQ);
withKeyPrefix("messagetype", "MESSAGETYPE" + EQ);
withKeyPrefix("messageid", "MESSAGEID" + EQ);

const TOTAL_BYTES = REQUEST_ASCII.length;

function fieldAtByte(idx: number): FieldKey | "separator" {
  for (const k of FIELD_KEYS) {
    const r = FIELD_RANGES[k];
    if (r && idx >= r.start && idx < r.end) return k;
  }
  return "separator";
}

// ── HEX band: contiguous segments in source order ────────────────────

type Segment = {
  field: FieldKey | "separator";
  start: number;
  end: number;
};

function buildSegments(): Segment[] {
  const segs: Segment[] = [];
  let cursor = 0;
  for (const k of FIELD_KEYS) {
    const r = FIELD_RANGES[k];
    if (!r) continue;
    if (r.start > cursor) {
      segs.push({ field: "separator", start: cursor, end: r.start });
    }
    segs.push({ field: k, start: r.start, end: r.end });
    cursor = r.end;
  }
  if (cursor < TOTAL_BYTES) {
    segs.push({ field: "separator", start: cursor, end: TOTAL_BYTES });
  }
  return segs;
}
const HEX_SEGMENTS = buildSegments();

// ── ASCII tokenization ───────────────────────────────────────────────

type AsciiToken =
  | { kind: "text"; value: string; at: number }
  | { kind: "delim"; value: typeof NP | typeof EQ | typeof EOM; at: number };

function tokenizeAscii(ascii: string): AsciiToken[] {
  const ds: Array<typeof NP | typeof EQ | typeof EOM> = [NP, EQ, EOM];
  const out: AsciiToken[] = [];
  let cursor = 0;
  while (cursor < ascii.length) {
    let nextDelim: (typeof NP | typeof EQ | typeof EOM) | null = null;
    let nextIdx = -1;
    for (const d of ds) {
      const idx = ascii.indexOf(d, cursor);
      if (idx !== -1 && (nextIdx === -1 || idx < nextIdx)) {
        nextIdx = idx;
        nextDelim = d;
      }
    }
    if (nextDelim === null) {
      out.push({ kind: "text", value: ascii.slice(cursor), at: cursor });
      break;
    }
    if (nextIdx > cursor) {
      out.push({
        kind: "text",
        value: ascii.slice(cursor, nextIdx),
        at: cursor
      });
    }
    out.push({ kind: "delim", value: nextDelim, at: nextIdx });
    cursor = nextIdx + nextDelim.length;
  }
  return out;
}
const ASCII_TOKENS = tokenizeAscii(REQUEST_ASCII);

const FIELD_NAMES = [
  "POSTQUEUE",
  "PROTOCOLVERSION",
  "QUEUE",
  "TOKEN",
  "MESSAGETYPE",
  "MESSAGEID"
] as const;

// ── Field rows for stage 3 ──────────────────────────────────────────

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  value: string;
  color: FieldColor;
}> = [
  {
    key: "postqueue",
    label: "POSTQUEUE",
    value: "(opcode — what to do)",
    color: "amber"
  },
  {
    key: "version",
    label: "PROTOCOLVERSION",
    value: "2",
    color: "slate"
  },
  {
    key: "queue",
    label: "QUEUE",
    value: "<base64 envelope · 256 B>",
    color: "sky"
  },
  {
    key: "token",
    label: "TOKEN",
    value: "7a3f9c2e-1d4b-4f6a-9b8e-2c5d8f1a0b7c",
    color: "emerald"
  },
  {
    key: "messagetype",
    label: "MESSAGETYPE",
    value: "VPPeople.Entities.PostActionMessage",
    color: "slate"
  },
  {
    key: "messageid",
    label: "MESSAGEID",
    value: "p12e4b8a-1f29-4a7c-9e6b-4fa02c813e12",
    color: "brand"
  }
];

// ── Visual class lookups ────────────────────────────────────────────

const SEG_CLASS: Record<FieldColor | "delim", string> = {
  amber: "bg-amber-400/15 text-amber-200",
  sky: "bg-sky-400/15 text-sky-200",
  emerald: "bg-emerald-400/15 text-emerald-200",
  brand: "bg-brand-500/20 text-brand-200",
  slate: "bg-white/[0.05] text-foreground/75",
  delim: "bg-white/[0.025] text-muted-foreground/50"
};

const ROW_CLASS: Record<FieldColor, string> = {
  amber: "border-l-amber-400/80",
  sky: "border-l-sky-400/80",
  emerald: "border-l-emerald-400/80",
  brand: "border-l-brand-500/80",
  slate: "border-l-white/30"
};

const ROW_KEY_CLASS: Record<FieldColor, string> = {
  amber: "text-amber-300",
  sky: "text-sky-300",
  emerald: "text-emerald-300",
  brand: "text-brand-300",
  slate: "text-muted-foreground"
};

const TAG_CLASS: Record<"np" | "eq" | "eom", string> = {
  np: "bg-amber-400/10 text-amber-200 border-amber-400/40",
  eq: "bg-sky-400/10 text-sky-200 border-sky-400/40",
  eom: "bg-brand-500/15 text-brand-200 border-brand-500/40"
};

// ── Cross-link CSS ──────────────────────────────────────────────────
// Scoped to .packet-inspector-root so nothing leaks. The body sets
// `linked` and `field-{key}`; CSS dims everything else and glows the
// matching field.

const CROSS_LINK_CSS = `
.packet-inspector-root {
  --pi-amber: 251 191 36;
  --pi-sky: 56 189 248;
  --pi-emerald: 52 211 153;
  --pi-brand: 106 134 245;
}
.packet-inspector-root .pi-glow {
  transition: background-color 220ms ease, border-color 220ms ease, opacity 220ms ease;
}
.packet-inspector-root.linked .has-field [data-field]:not([data-field="separator"]) {
  opacity: 0.42;
  transition: opacity 220ms ease;
}
.packet-inspector-root.linked.field-postqueue .has-field [data-field="postqueue"],
.packet-inspector-root.linked.field-version .has-field [data-field="version"],
.packet-inspector-root.linked.field-queue .has-field [data-field="queue"],
.packet-inspector-root.linked.field-token .has-field [data-field="token"],
.packet-inspector-root.linked.field-messagetype .has-field [data-field="messagetype"],
.packet-inspector-root.linked.field-messageid .has-field [data-field="messageid"] {
  opacity: 1;
}
.packet-inspector-root.linked.field-postqueue .has-field .pi-glow[data-field="postqueue"] {
  background-color: rgb(var(--pi-amber) / 0.22);
  border-color: rgb(var(--pi-amber) / 0.55);
}
.packet-inspector-root.linked.field-version .has-field .pi-glow[data-field="version"] {
  background-color: rgb(255 255 255 / 0.06);
  border-color: rgb(255 255 255 / 0.2);
}
.packet-inspector-root.linked.field-queue .has-field .pi-glow[data-field="queue"] {
  background-color: rgb(var(--pi-sky) / 0.22);
  border-color: rgb(var(--pi-sky) / 0.55);
}
.packet-inspector-root.linked.field-token .has-field .pi-glow[data-field="token"] {
  background-color: rgb(var(--pi-emerald) / 0.22);
  border-color: rgb(var(--pi-emerald) / 0.55);
}
.packet-inspector-root.linked.field-messagetype .has-field .pi-glow[data-field="messagetype"] {
  background-color: rgb(255 255 255 / 0.06);
  border-color: rgb(255 255 255 / 0.2);
}
.packet-inspector-root.linked.field-messageid .has-field .pi-glow[data-field="messageid"] {
  background-color: rgb(var(--pi-brand) / 0.22);
  border-color: rgb(var(--pi-brand) / 0.55);
}
`.trim();

// ── Component ────────────────────────────────────────────────────────

export function PacketInspector() {
  const [activeField, setActiveField] = useState<string | null>(null);

  const onMouseOver = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    const t = (ev.target as HTMLElement).closest("[data-field]");
    if (!t) return;
    setActiveField(t.getAttribute("data-field"));
  }, []);

  const onMouseLeave = useCallback(() => setActiveField(null), []);

  const linked = activeField !== null && activeField !== "separator";
  const fieldClass = linked ? `field-${activeField}` : "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CROSS_LINK_CSS }} />
      <div
        className={`packet-inspector-root glass-panel rounded-2xl p-6 sm:p-8 ${
          linked ? "linked " + fieldClass : ""
        }`}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
      >
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          An example of how a pre-bill is sent to the POS &mdash; the
          integration runs backwards, we&rsquo;re the ones sending.
          Every field was lifted from MITM Wireshark captures off the
          waiters&rsquo; Android handheld; none are ours, they&rsquo;re
          how the POS already talks.
        </p>

        {/* HEX BAND — full width, proportional segments + collapsible ASCII */}
        <Stage1HexBand />

        {/* TWO STAGES — flexible, no inner scroll */}
        <div className="mt-6 has-field grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Stage3Fields />
          <Stage4Action />
        </div>
      </div>
    </>
  );
}

// ── Stage 1 — HEX band + collapsible ASCII ─────────────────────────

function Stage1HexBand() {
  const [showAscii, setShowAscii] = useState(false);

  return (
    <section
      aria-label="Stage 1 — HEX bytes as a ruler"
      className="has-field mt-8 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span className="text-foreground/40">01</span> Hex bytes
            representation
          </span>
        </div>
        <span className="mono text-[10.5px] tracking-wider text-muted-foreground">
          {TOTAL_BYTES} B
        </span>
      </header>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Our message is represented in bytes, and just like TCP or UDP
        it has to be formatted to send information. Each block is a
        piece of it.
      </p>
      <div className="flex h-8 w-full overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
        {HEX_SEGMENTS.map((seg, i) => {
          const widthPct = ((seg.end - seg.start) / TOTAL_BYTES) * 100;
          if (widthPct < 0.4) return null; // skip hairline separators
          const isField = seg.field !== "separator";
          const colorKey = isField
            ? FIELD_COLOR[seg.field as FieldKey]
            : "delim";
          const labelText = isField ? FIELD_LABEL[seg.field as FieldKey] : "";
          const bytes = seg.end - seg.start;
          let label = "";
          if (widthPct > 14 && labelText) label = `${labelText} · ${bytes} B`;
          else if (widthPct > 7 && labelText) label = labelText;
          else if (widthPct > 3 && labelText) label = labelText.slice(0, 4);
          return (
            <div
              key={i}
              data-field={seg.field}
              className={`pi-glow flex h-full items-center justify-center overflow-hidden whitespace-nowrap border-r border-background/40 mono text-[9.5px] uppercase tracking-[0.08em] last:border-r-0 ${SEG_CLASS[colorKey]}`}
              style={{ width: `${widthPct}%` }}
              title={
                isField
                  ? `${FIELD_LABEL[seg.field as FieldKey]} · ${bytes} B`
                  : `${bytes} B separator`
              }
            >
              {label}
            </div>
          );
        })}
      </div>
      <div className="mono flex justify-between text-[10px] text-muted-foreground/70">
        <span>0</span>
        <span>120</span>
        <span>240</span>
        <span>360</span>
        <span>{TOTAL_BYTES}</span>
      </div>

      {/* Disclosure: toggle the printable-form ASCII */}
      <div className="mt-1 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={() => setShowAscii(v => !v)}
          aria-expanded={showAscii}
          aria-controls="hex-ascii-content"
          className="group flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${
              showAscii ? "rotate-90" : ""
            }`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <path
              d="M4 2 L8 6 L4 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mono text-[10.5px] font-medium uppercase tracking-[0.22em]">
            <span className="text-foreground/40">02</span>{" "}
            {showAscii ? "Hide" : "Show"} printable form
          </span>
          <span className="text-[12px] text-muted-foreground/80">
            &mdash; same bytes, decoded
          </span>
        </button>

        <div
          id="hex-ascii-content"
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
            showAscii ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-3 rounded-lg border border-white/5 bg-background/70 p-3.5">
              <div className="mono break-all text-[12px] leading-[1.85] text-foreground/85">
                {ASCII_TOKENS.map((token, i) => {
                  if (token.kind === "delim") {
                    const f = fieldAtByte(token.at);
                    const cls =
                      token.value === EOM
                        ? "eom"
                        : token.value === EQ
                          ? "eq"
                          : "np";
                    return (
                      <span
                        key={`tok-${i}`}
                        data-field={f === "separator" ? "separator" : f}
                        className={`mx-[2px] inline-block rounded border px-1.5 py-[1px] align-middle text-[10px] uppercase tracking-[0.1em] leading-[1.4] ${TAG_CLASS[cls]}`}
                      >
                        {token.value.slice(1, -1)}
                      </span>
                    );
                  }
                  return (
                    <span key={`tok-${i}`}>
                      {renderTextSegment(token.value, token.at, `seg-${i}`)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderTextSegment(
  value: string,
  startAt: number,
  keyBase: string
): ReactNode[] {
  // split on field-name keywords so we can color them; the regex's
  // outer parens keep the matches in the split output
  const pattern = new RegExp(`(${FIELD_NAMES.join("|")})`);
  const parts = value.split(pattern);
  const out: ReactNode[] = [];
  let cursor = startAt;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "") continue;
    const at = cursor;
    const f = fieldAtByte(at);
    const isKey = (FIELD_NAMES as readonly string[]).includes(part);
    if (isKey) {
      const key = part as (typeof FIELD_NAMES)[number];
      out.push(
        <span
          key={`${keyBase}-fn-${i}`}
          data-field={f}
          className={
            key === "POSTQUEUE"
              ? "font-semibold text-amber-300"
              : key === "MESSAGEID"
                ? "text-brand-300"
                : key === "TOKEN"
                  ? "text-emerald-300"
                  : "text-sky-300"
          }
        >
          {part}
        </span>
      );
    } else {
      out.push(
        <span
          key={`${keyBase}-txt-${i}`}
          data-field={f}
          className={
            f === "queue" ? "text-foreground/55" : "text-foreground/80"
          }
        >
          {part}
        </span>
      );
    }
    cursor += part.length;
  }
  return out;
}

// ── Stage 3 — Fields (numbered 03 in DOM, follows the 02 disclosure) ─

function Stage3Fields() {
  return (
    <StageCard num="03" label="Named fields" meta="6">
      <div className="flex flex-col gap-1.5">
        {FIELDS.map(f => (
          <div
            key={f.key}
            data-field={f.key}
            className={`pi-glow grid grid-cols-[120px_1fr] items-center gap-3 rounded-md border border-white/10 border-l-2 ${ROW_CLASS[f.color]} bg-white/[0.025] px-2.5 py-2`}
          >
            <span
              className={`mono text-[10px] font-semibold uppercase tracking-[0.1em] ${ROW_KEY_CLASS[f.color]}`}
            >
              {f.label}
            </span>
            <span className="mono truncate text-[11px] text-foreground/80">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </StageCard>
  );
}

// ── Stage 4 — Action ────────────────────────────────────────────────

function Stage4Action() {
  return (
    <StageCard num="04" label="The action" meta="POSTQUEUE">
      <div className="flex flex-col gap-3">
        <div className="text-[19px] font-semibold leading-tight tracking-tight text-foreground">
          Open{" "}
          <span data-field="queue" className="text-sky-300">
            table&nbsp;12
          </span>
          &rsquo;s{" "}
          <span
            data-field="postqueue"
            className="rounded bg-amber-400/20 px-1 font-bold text-amber-200"
          >
            pre-bill
          </span>
          .
        </div>
        <p className="text-[13px] leading-snug text-foreground/85">
          Sent by{" "}
          <span data-field="queue" className="text-sky-300">
            employee&nbsp;19
          </span>
          , with the POS&rsquo;s{" "}
          <span data-field="token" className="text-emerald-300">
            session token
          </span>
          , keyed off both an in-payload{" "}
          <span data-field="queue" className="text-sky-300">
            guid
          </span>{" "}
          and a protocol-level{" "}
          <span data-field="messageid" className="text-brand-300">
            message&nbsp;id
          </span>{" "}
          &mdash; so a retry doesn&rsquo;t double-print.
        </p>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-1 p-0">
          <ActionFact field="queue" k="Action" v="3 · pre-bill" />
          <ActionFact field="queue" k="Table" v="12" />
          <ActionFact field="queue" k="Employee" v="19" />
          <ActionFact field="queue" k="Captured at" v="17:40 UTC" />
          <ActionFact field="token" k="Session" v="7a3f…0b7c" />
          <ActionFact field="messageid" k="Message id" v="p12e…3e12" />
          <ActionFact field="version" k="Protocol" v="v2" />
          <ActionFact field="messagetype" k="Class" v="PostActionMessage" />
        </ul>
      </div>
    </StageCard>
  );
}

function ActionFact({
  field,
  k,
  v
}: {
  field: FieldKey;
  k: string;
  v: string;
}) {
  return (
    <li
      data-field={field}
      className="flex items-baseline justify-between gap-2 rounded-sm border-b border-dashed border-white/10 py-1 text-[11.5px]"
    >
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right font-medium text-foreground">
        {v}
      </span>
    </li>
  );
}

// ── StageCard wrapper (header + body, no inner scroll) ──────────────

function StageCard({
  num,
  label,
  meta,
  title,
  children
}: {
  num: string;
  label: string;
  meta: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title ? `${label} — ${title}` : label}
      className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-foreground/40">{num}</span> {label}
        </span>
        <span className="mono text-[10.5px] tracking-wider text-muted-foreground">
          {meta}
        </span>
      </header>
      {title ? (
        <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
          {title}
        </h4>
      ) : null}
      <div className="flex-1 rounded-lg border border-white/5 bg-background/70 p-3.5">
        {children}
      </div>
    </section>
  );
}

// Keep an explicit reference to REQUEST_QUEUE so it stays in the
// fixture chain even though the new layout summarises rather than
// pretty-prints the JSON. If you want to expose it again, render it in
// the action stage.
void REQUEST_QUEUE;
