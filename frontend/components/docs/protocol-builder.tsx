"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProtocolField = {
  key: string;
  label: string;
  value: string;
  /** Optional helper text rendered below the input. */
  hint?: string;
  /** If provided, renders as a `<select>` with these options. */
  options?: Array<{ value: string; label: string }>;
};

type ProtocolBuilderProps = {
  op?: string;
  fields?: ProtocolField[];
  className?: string;
};

const DEFAULT_OP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "GETBOARDCONTENT", label: "GETBOARDCONTENT — fetch table items" },
  { value: "GETBOARDS", label: "GETBOARDS — list tables" },
  { value: "OPENTABLE", label: "OPENTABLE — open a table for a user" },
  { value: "CLOSEBOARD", label: "CLOSEBOARD — close a table" },
  { value: "ADDITEM", label: "ADDITEM — append an item line" }
];

const DEFAULT_FIELDS: ProtocolField[] = [
  {
    key: "TABLE",
    label: "TABLE",
    value: "12",
    hint: "Target table number on the PDV."
  },
  {
    key: "USER",
    label: "USER",
    value: "204",
    hint: "Employee ID — must match an opened shift."
  },
  {
    key: "TOKEN",
    label: "TOKEN",
    value: "e7c1a9b34f",
    hint: "Session token handed out by the vendor cloud."
  }
];

/**
 * Interactive builder for the synthesised POS message format.
 *
 * Renders a form of parameter inputs and, beneath it, a live `<pre>`
 * showing the assembled `[NP]KEY=value[NP]...[EOM]` envelope. The
 * component is fully client-side and does not touch the network.
 */
export function ProtocolBuilder({
  op: initialOp = "GETBOARDCONTENT",
  fields: initialFields = DEFAULT_FIELDS,
  className
}: ProtocolBuilderProps) {
  const [op, setOp] = useState(initialOp);
  const [fields, setFields] = useState<ProtocolField[]>(() =>
    initialFields.map(f => ({ ...f }))
  );

  const assembledMessage = useMemo(() => {
    const parts = [`[NP]OP=${op}`];
    for (const field of fields) {
      const trimmed = field.value.trim();
      if (!trimmed) continue;
      parts.push(`[NP]${field.key}=${trimmed}`);
    }
    return `${parts.join("")}[EOM]`;
  }, [op, fields]);

  const byteLength = useMemo(
    () =>
      typeof TextEncoder !== "undefined"
        ? new TextEncoder().encode(assembledMessage).length
        : assembledMessage.length,
    [assembledMessage]
  );

  const updateField = (key: string, value: string) => {
    setFields(prev =>
      prev.map(f => (f.key === key ? { ...f, value } : f))
    );
  };

  const reset = () => {
    setOp(initialOp);
    setFields(initialFields.map(f => ({ ...f })));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Protocol builder
          </h4>
          <p className="text-xs text-muted-foreground">
            Tweak the parameters; watch the on-wire envelope update in place.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" aria-hidden /> Reset
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">OP</span>
          <select
            value={op}
            onChange={event => setOp(event.target.value)}
            className={cn(
              "rounded-md border border-input bg-background px-3 py-2 text-sm",
              "shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          >
            {DEFAULT_OP_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            The opcode the PDV switches on before parsing the rest.
          </span>
        </label>

        {fields.map(field => (
          <label
            key={field.key}
            className="flex flex-col gap-1 text-sm"
          >
            <span className="font-medium text-foreground">{field.label}</span>
            {field.options ? (
              <select
                value={field.value}
                onChange={event => updateField(field.key, event.target.value)}
                className={cn(
                  "rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                )}
              >
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={field.value}
                onChange={event => updateField(field.key, event.target.value)}
                spellCheck={false}
                autoComplete="off"
                className={cn(
                  "rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  "mono"
                )}
              />
            )}
            {field.hint ? (
              <span className="text-xs text-muted-foreground">{field.hint}</span>
            ) : null}
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-xl border bg-slate-950 p-3 text-slate-50 shadow-inner">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-slate-400">
          <span>Assembled message</span>
          <span>{byteLength} bytes</span>
        </div>
        <pre className="mono mt-2 whitespace-pre-wrap break-words text-xs leading-6">
          {assembledMessage}
        </pre>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        <span className="mono">[NP]</span> separates fields,
        <span className="mono"> [EOM]</span> terminates the message. Opaque
        blobs (keyed menus, signatures) travel inside individual values as
        base64 — rendered verbatim here.
      </p>
    </div>
  );
}

export function ProtocolBuilderDemo() {
  return <ProtocolBuilder />;
}
