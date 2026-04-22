import type { ReactNode } from "react";

import prebillTrace from "@/lib/fixtures/prebill-trace-12.json";

// Stylized three-stage inspector. Not a faithful Wireshark clone — the
// packet-list row is a representative LAN shape; the hex/ASCII dump and
// the downstream views are derived directly from the canonical fixture
// imported above so that byte offsets stay truthful.

const wire = prebillTrace.wire_trace;
const REQUEST_ASCII = wire.request.ascii;
const REQUEST_HEX = wire.request.hex;
const REQUEST_QUEUE = wire.payloads.request_queue;

// Delimiters — mirrors lib/pos/constants.ts exports (NP / EQ / EOM).
const NP = "[NP]";
const EQ = "[EQ]";
const EOM = "[EOM]";

type HighlightColor = "amber" | "sky" | "emerald" | "brand";

type HighlightRange = {
  color: HighlightColor;
  label: string;
  start: number; // inclusive byte offset
  end: number; // exclusive byte offset
};

// --- Stage 1 byte-range derivation (computed once, from the ASCII ---
// mirror of the fixture bytes, so highlights stay aligned if the
// fixture ever changes).

function computeHighlights(ascii: string): HighlightRange[] {
  const highlights: HighlightRange[] = [];

  // POSTQUEUE opcode — the very first 9 bytes.
  const opcodeIdx = ascii.indexOf("POSTQUEUE");
  if (opcodeIdx !== -1) {
    highlights.push({
      color: "amber",
      label: "POSTQUEUE opcode",
      start: opcodeIdx,
      end: opcodeIdx + "POSTQUEUE".length,
    });
  }

  // QUEUE[EQ]<base64>…[NP] — up to the next [NP] after the key+sep.
  const queueKey = "QUEUE" + EQ;
  const queueKeyIdx = ascii.indexOf(queueKey);
  if (queueKeyIdx !== -1) {
    const queueNextNp = ascii.indexOf(NP, queueKeyIdx + queueKey.length);
    highlights.push({
      color: "sky",
      label: "QUEUE[EQ] + Base64 payload",
      start: queueKeyIdx,
      end: queueNextNp === -1 ? ascii.length : queueNextNp,
    });
  }

  // TOKEN[EQ]<uuid>…[NP] — same shape.
  const tokenKey = "TOKEN" + EQ;
  const tokenKeyIdx = ascii.indexOf(tokenKey);
  if (tokenKeyIdx !== -1) {
    const tokenNextNp = ascii.indexOf(NP, tokenKeyIdx + tokenKey.length);
    highlights.push({
      color: "emerald",
      label: "TOKEN[EQ] + UUID",
      start: tokenKeyIdx,
      end: tokenNextNp === -1 ? ascii.length : tokenNextNp,
    });
  }

  // Trailing [EOM] — last 5 bytes.
  const eomIdx = ascii.lastIndexOf(EOM);
  if (eomIdx !== -1) {
    highlights.push({
      color: "brand",
      label: "[EOM] terminator",
      start: eomIdx,
      end: eomIdx + EOM.length,
    });
  }

  return highlights;
}

const HIGHLIGHTS = computeHighlights(REQUEST_ASCII);

// Tailwind classes keyed by highlight color. The dot uses solid bg, the
// inline byte overlay uses a translucent bg + foreground-preserving text.
const COLOR_CLASS: Record<
  HighlightColor,
  { dot: string; chip: string; overlay: string; border: string }
> = {
  amber: {
    dot: "bg-amber-400",
    chip: "bg-amber-400/10 text-amber-200 border-amber-400/40",
    overlay: "bg-amber-400/20 text-amber-100",
    border: "border-amber-400/40",
  },
  sky: {
    dot: "bg-sky-400",
    chip: "bg-sky-400/10 text-sky-200 border-sky-400/40",
    overlay: "bg-sky-400/20 text-sky-100",
    border: "border-sky-400/40",
  },
  emerald: {
    dot: "bg-emerald-400",
    chip: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    overlay: "bg-emerald-400/20 text-emerald-100",
    border: "border-emerald-400/40",
  },
  brand: {
    dot: "bg-brand-500",
    chip: "bg-brand-500/10 text-brand-200 border-brand-500/40",
    overlay: "bg-brand-500/25 text-brand-100",
    border: "border-brand-500/40",
  },
};

// --- Hex/ASCII dump rendering ----------------------------------------

type DumpCell = {
  byteIndex: number;
  hex: string; // 2 chars
  ascii: string; // 1 char, printable or '.'
};

type DumpRow = {
  offset: number;
  cells: DumpCell[];
};

function toPrintable(charCode: number): string {
  // Same convention as classic hex dumps — anything outside 0x20..0x7e
  // becomes '.'.
  if (charCode >= 0x20 && charCode <= 0x7e) {
    return String.fromCharCode(charCode);
  }
  return ".";
}

function buildDumpRows(hex: string, bytesPerRow = 16): DumpRow[] {
  const rows: DumpRow[] = [];
  const byteCount = hex.length / 2;
  for (let offset = 0; offset < byteCount; offset += bytesPerRow) {
    const cells: DumpCell[] = [];
    for (let i = 0; i < bytesPerRow && offset + i < byteCount; i++) {
      const byteIndex = offset + i;
      const hexPair = hex.slice(byteIndex * 2, byteIndex * 2 + 2);
      const ch = toPrintable(parseInt(hexPair, 16));
      cells.push({ byteIndex, hex: hexPair, ascii: ch });
    }
    rows.push({ offset, cells });
  }
  return rows;
}

function colorForByte(index: number): HighlightColor | null {
  for (const h of HIGHLIGHTS) {
    if (index >= h.start && index < h.end) return h.color;
  }
  return null;
}

const DUMP_ROWS = buildDumpRows(REQUEST_HEX, 16);

function formatOffset(n: number): string {
  return n.toString(16).padStart(4, "0");
}

// --- Stage 2 ASCII tokenization --------------------------------------

type AsciiToken =
  | { kind: "text"; value: string }
  | { kind: "delim"; value: typeof NP | typeof EQ | typeof EOM };

function tokenizeAscii(ascii: string): AsciiToken[] {
  const delims: Array<typeof NP | typeof EQ | typeof EOM> = [NP, EQ, EOM];
  const tokens: AsciiToken[] = [];
  let cursor = 0;
  while (cursor < ascii.length) {
    // Find the earliest occurrence of any delimiter at or after cursor.
    let nextDelim: typeof NP | typeof EQ | typeof EOM | null = null;
    let nextIdx = -1;
    for (const d of delims) {
      const idx = ascii.indexOf(d, cursor);
      if (idx !== -1 && (nextIdx === -1 || idx < nextIdx)) {
        nextIdx = idx;
        nextDelim = d;
      }
    }
    if (nextDelim === null || nextIdx === -1) {
      tokens.push({ kind: "text", value: ascii.slice(cursor) });
      break;
    }
    if (nextIdx > cursor) {
      tokens.push({ kind: "text", value: ascii.slice(cursor, nextIdx) });
    }
    tokens.push({ kind: "delim", value: nextDelim });
    cursor = nextIdx + nextDelim.length;
  }
  return tokens;
}

const ASCII_TOKENS = tokenizeAscii(REQUEST_ASCII);

// Field names worth distinguishing inside plain text segments.
const FIELD_NAMES = [
  "POSTQUEUE",
  "PROTOCOLVERSION",
  "QUEUE",
  "TOKEN",
  "MESSAGETYPE",
  "MESSAGEID",
] as const;

function renderTextSegment(value: string, keyBase: string): ReactNode[] {
  // Split on field names while preserving them. Matches are whole words
  // only — the regex's outer parens keep the delimiters in the split.
  const pattern = new RegExp(`(${FIELD_NAMES.join("|")})`);
  const parts = value.split(pattern);
  return parts.map((part, i) => {
    if (FIELD_NAMES.includes(part as (typeof FIELD_NAMES)[number])) {
      return (
        <span key={`${keyBase}-fn-${i}`} className="text-sky-300/90">
          {part}
        </span>
      );
    }
    return (
      <span key={`${keyBase}-txt-${i}`} className="text-foreground/80">
        {part}
      </span>
    );
  });
}

function delimColor(value: string): HighlightColor {
  if (value === EOM) return "brand";
  if (value === EQ) return "sky";
  return "amber"; // NP
}

// --- Stage 3 JSON annotation -----------------------------------------

type Annotation = {
  key: string;
  note: string;
};

const JSON_ANNOTATIONS: Annotation[] = [
  { key: '"Action": 3', note: "PREBILL (lib/pos/constants.ts:50-54)" },
  { key: '"table": 12', note: "same table opened in the embedded demo" },
  { key: '"employeeId": 19', note: "demo employee" },
  { key: '"guid"', note: "idempotency key" },
  {
    key: '"time": 1737394812012',
    note: "Jan 20 2025, 17:40 UTC — epoch ms",
  },
];

function renderAnnotatedJson(value: unknown): ReactNode {
  const pretty = JSON.stringify(value, null, 2);
  const lines = pretty.split("\n");
  return (
    <div className="grid gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:gap-x-6">
      {lines.map((line, lineIdx) => {
        const note = JSON_ANNOTATIONS.find(a => line.includes(a.key))?.note;
        return (
          <div
            key={`json-line-${lineIdx}`}
            className="contents"
          >
            <pre className="mono whitespace-pre text-[12px] leading-6 text-foreground/85">
              {line}
            </pre>
            <p
              className={`mono text-[11px] leading-6 text-muted-foreground sm:pl-3 ${
                note ? "" : "hidden sm:block"
              }`}
            >
              {note ? `← ${note}` : " "}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// --- Component -------------------------------------------------------

export function PacketInspector() {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <p className="eyebrow">Packet transformation</p>
        <h3 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          One pre-bill, read three ways.
        </h3>
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          The same 482 bytes on the wire, the same bytes re-read as a TLV
          message, the same bytes decoded into the action the PDV actually
          runs. Table 12, pre-bill, captured once.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <Stage1Wire />
        <StageArrow />
        <Stage2Message />
        <StageArrow />
        <Stage3Decoded />
      </div>
    </div>
  );
}

function StageArrow() {
  return (
    <div
      className="mono flex items-center justify-center text-[18px] leading-none text-foreground/30"
      aria-hidden
    >
      <span>&darr;</span>
    </div>
  );
}

function StageHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-3">
        <span className="mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Stage {index}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <h4 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h4>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function Stage1Wire() {
  return (
    <section
      aria-label="Stage 1 — raw packet on the wire"
      className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
    >
      <StageHeading
        index="1"
        title="On the wire"
        subtitle="The bytes as tcpdump sees them. 482 B TCP segment, representative LAN shape."
      />

      {/* Synthetic Wireshark-style packet list row */}
      <div className="rounded-lg border border-white/5 bg-background/50 p-3">
        <p className="mono text-[11px] leading-relaxed text-foreground/80">
          <span className="text-muted-foreground">1 &middot; 0.031s &middot; </span>
          <span className="text-foreground/90">10.0.0.42:52314</span>
          <span className="text-muted-foreground"> &rarr; </span>
          <span className="text-foreground/90">10.0.0.3:8099</span>
          <span className="text-muted-foreground"> &middot; TCP &middot; 482 B &middot; </span>
          <span className="text-amber-200">POSTQUEUE</span>
          <span className="text-muted-foreground"> (pre-bill, table 12)</span>
        </p>
        <p className="mono mt-1 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
          representative LAN shape
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {HIGHLIGHTS.map(h => (
          <div
            key={h.label}
            className="flex items-center gap-2 text-[12px] text-foreground/80"
          >
            <span
              className={`h-2 w-2 rounded-full ${COLOR_CLASS[h.color].dot}`}
              aria-hidden
            />
            <span className="mono">{h.label}</span>
          </div>
        ))}
      </div>

      {/* Hex/ASCII dump */}
      <div className="rounded-lg border border-white/5 bg-background/70 p-3">
        <div className="overflow-x-auto">
          <div className="mono min-w-max text-[11px] leading-5 text-foreground/85">
            {DUMP_ROWS.map(row => (
              <DumpRowView key={row.offset} row={row} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DumpRowView({ row }: { row: DumpRow }) {
  return (
    <div className="flex gap-4">
      <span className="text-muted-foreground">{formatOffset(row.offset)}</span>
      <span className="whitespace-pre">{renderHexCells(row.cells)}</span>
      <span className="whitespace-pre">{renderAsciiCells(row.cells)}</span>
    </div>
  );
}

function renderHexCells(cells: DumpCell[]): ReactNode[] {
  // 16-byte layout — space between every byte, double space between the
  // 8-byte halves.
  const nodes: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const cell = cells[i];
    const half = i === 8 ? " " : ""; // extra space at the 8-byte boundary
    if (!cell) {
      nodes.push(
        <span key={`pad-${i}`} className="text-transparent">
          {half}
          {"  "}
          {i < 15 ? " " : ""}
        </span>,
      );
      continue;
    }
    const color = colorForByte(cell.byteIndex);
    const cls = color
      ? `${COLOR_CLASS[color].overlay} rounded-[2px] px-[1px]`
      : "text-foreground/70";
    nodes.push(
      <span key={`hex-${cell.byteIndex}-half`}>{half}</span>,
      <span key={`hex-${cell.byteIndex}`} className={cls}>
        {cell.hex}
      </span>,
      <span key={`hex-${cell.byteIndex}-sp`}>{i < 15 ? " " : ""}</span>,
    );
  }
  return nodes;
}

function renderAsciiCells(cells: DumpCell[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const cell = cells[i];
    if (!cell) {
      nodes.push(
        <span key={`apad-${i}`} className="text-transparent">
          {" "}
        </span>,
      );
      continue;
    }
    const color = colorForByte(cell.byteIndex);
    const cls = color
      ? `${COLOR_CLASS[color].overlay} rounded-[2px]`
      : "text-foreground/70";
    nodes.push(
      <span key={`ascii-${cell.byteIndex}`} className={cls}>
        {cell.ascii}
      </span>,
    );
  }
  return nodes;
}

function Stage2Message() {
  return (
    <section
      aria-label="Stage 2 — interpreted as a TLV message"
      className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
    >
      <StageHeading
        index="2"
        title="Read as a message"
        subtitle="Same bytes, grouped around the [NP] / [EQ] / [EOM] delimiters."
      />

      <div className="rounded-lg border border-white/5 bg-background/70 p-3">
        <div className="mono text-[12px] leading-7 break-all text-foreground/85">
          {ASCII_TOKENS.map((token, i) => {
            if (token.kind === "delim") {
              const color = delimColor(token.value);
              return (
                <span
                  key={`tok-${i}`}
                  className={`mx-[2px] inline-block rounded border px-1.5 py-[1px] text-[10.5px] uppercase tracking-[0.12em] align-middle ${COLOR_CLASS[color].chip}`}
                >
                  {token.value.slice(1, -1)}
                </span>
              );
            }
            return (
              <span key={`tok-${i}`}>
                {renderTextSegment(token.value, `seg-${i}`)}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Delimiters at{" "}
        <span className="mono text-foreground/70">
          lib/pos/constants.ts:3-5
        </span>
        {" "}&middot; parser at{" "}
        <span className="mono text-foreground/70">
          lib/pos/wire-parser.ts:45-72
        </span>
      </p>
    </section>
  );
}

function Stage3Decoded() {
  return (
    <section
      aria-label="Stage 3 — decoded QUEUE payload"
      className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
    >
      <StageHeading
        index="3"
        title="Decoded QUEUE"
        subtitle="Base64 of the QUEUE field, parsed as JSON. This is what the PDV actually runs."
      />

      <div className="rounded-lg border border-white/5 bg-background/70 p-4">
        {renderAnnotatedJson(REQUEST_QUEUE)}
      </div>
    </section>
  );
}
