import type { ReactNode } from "react";

type TrustZone = {
  index: string;
  label: string;
  control: "none" | "ours" | "tunnel";
  controlNote: string;
  nodes: TopologyNode[];
};

type TopologyNode = {
  name: string;
  meta: string;
  role: "vendor" | "ours" | "external";
};

const ZONES: TrustZone[] = [
  {
    index: "01",
    label: "Vendor",
    control: "none",
    controlNote: "we don't control",
    nodes: [
      { name: "PDV", meta: "Windows · vendor binary", role: "vendor" },
      { name: "Handheld", meta: "Android · waiter app", role: "vendor" },
      { name: "Vendor cloud", meta: "auth · sync", role: "vendor" }
    ]
  },
  {
    index: "02",
    label: "Our cloud",
    control: "ours",
    controlNote: "we host ourselves",
    nodes: [
      { name: "NestJS", meta: "Oracle Cloud VM", role: "ours" },
      { name: "WhatsApp webhook", meta: "Meta Cloud API", role: "external" }
    ]
  },
  {
    index: "03",
    label: "Shop LAN",
    control: "tunnel",
    controlNote: "we reach in over a private tunnel",
    nodes: [
      { name: "FastAPI agent", meta: "Python · Raspberry Pi", role: "ours" }
    ]
  }
];

const ROLE_CLASS: Record<TopologyNode["role"], string> = {
  vendor:
    "border-white/10 bg-white/[0.02] text-muted-foreground",
  ours: "border-foreground/30 bg-foreground/[0.06] text-foreground",
  external: "border-white/10 bg-white/[0.02] text-foreground/80"
};

const CONTROL_CLASS: Record<TrustZone["control"], string> = {
  none: "border-dashed border-white/10",
  ours: "border-foreground/25",
  tunnel: "border-foreground/15"
};

const CONTROL_DOT: Record<TrustZone["control"], string> = {
  none: "bg-white/20",
  ours: "bg-foreground",
  tunnel: "bg-foreground/60"
};

export function DeploymentTopology() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-7">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="eyebrow">Trust zones, stacked</p>
        <p className="mono text-[10px] text-muted-foreground">
          3 zones &middot; 1 tunnel
        </p>
      </div>

      <ol className="relative flex flex-col gap-3">
        {ZONES.map((zone, i) => (
          <ZoneRow
            key={zone.index}
            zone={zone}
            connector={i < ZONES.length - 1 ? CONNECTORS[i] : null}
          />
        ))}
      </ol>

      <p className="mt-6 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        Our backend is split across the middle two zones &mdash; a NestJS on
        an Oracle VM drives a Python agent we dropped on a Raspberry Pi
        inside the shop. The vendor zone is never touched.
      </p>
    </div>
  );
}

type Connector = {
  label: string;
  detail: string;
  kind: "protocol" | "tunnel";
};

const CONNECTORS: Connector[] = [
  {
    label: "private tunnel",
    detail: "outbound from the Pi · cloud drives the agent",
    kind: "tunnel"
  },
  {
    label: "vendor TCP",
    detail: "POSTQUEUE · TOKEN · [EOM] on shop LAN",
    kind: "protocol"
  }
];

function ZoneRow({
  zone,
  connector
}: {
  zone: TrustZone;
  connector: Connector | null;
}) {
  return (
    <li className="flex flex-col gap-3">
      <div
        className={`rounded-xl border ${CONTROL_CLASS[zone.control]} bg-background/40 p-4 sm:p-5`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex w-full shrink-0 flex-row items-center gap-3 sm:w-44 sm:flex-col sm:items-start sm:gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${CONTROL_DOT[zone.control]}`}
                aria-hidden
              />
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Zone {zone.index}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                {zone.label}
              </span>
              <span className="text-[12px] italic text-muted-foreground">
                {zone.controlNote}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap gap-2">
            {zone.nodes.map(node => (
              <NodeChip key={node.name} node={node} />
            ))}
          </div>
        </div>
      </div>

      {connector ? <Connector connector={connector} /> : null}
    </li>
  );
}

function NodeChip({ node }: { node: TopologyNode }) {
  return (
    <div
      className={`flex min-w-[140px] flex-col gap-0.5 rounded-lg border px-3 py-2 ${ROLE_CLASS[node.role]}`}
    >
      <span className="text-[13px] font-medium tracking-tight">
        {node.name}
      </span>
      <span className="mono text-[10.5px] text-muted-foreground">
        {node.meta}
      </span>
    </div>
  );
}

function Connector({ connector }: { connector: Connector }) {
  const accent =
    connector.kind === "tunnel"
      ? "text-foreground/80"
      : "text-muted-foreground";
  return (
    <div
      aria-hidden
      className="flex items-center gap-3 pl-2 sm:pl-6"
    >
      <ConnectorGlyph kind={connector.kind} />
      <div className="flex flex-col leading-tight">
        <span
          className={`mono text-[10.5px] uppercase tracking-[0.18em] ${accent}`}
        >
          {connector.label}
        </span>
        <span className="text-[11.5px] text-muted-foreground">
          {connector.detail}
        </span>
      </div>
    </div>
  );
}

function ConnectorGlyph({ kind }: { kind: Connector["kind"] }) {
  // Vertical glyph that visually distinguishes a private tunnel (solid,
  // bidirectional, lit endpoints) from a plain protocol link (dashed).
  if (kind === "tunnel") {
    return (
      <svg
        width="18"
        height="40"
        viewBox="0 0 18 40"
        fill="none"
        className="shrink-0"
      >
        <circle cx="9" cy="3" r="2.5" fill="rgb(229 229 229)" />
        <line
          x1="9"
          y1="6"
          x2="9"
          y2="34"
          stroke="rgb(229 229 229 / 0.5)"
          strokeWidth="1.25"
        />
        <path
          d="M5 30 L9 34 L13 30"
          stroke="rgb(229 229 229 / 0.7)"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10 L9 6 L13 10"
          stroke="rgb(229 229 229 / 0.7)"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="37" r="2.5" fill="rgb(229 229 229)" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="40"
      viewBox="0 0 18 40"
      fill="none"
      className="shrink-0"
    >
      <line
        x1="9"
        y1="3"
        x2="9"
        y2="37"
        stroke="rgb(255 255 255 / 0.25)"
        strokeWidth="1.25"
        strokeDasharray="2 4"
      />
      <path
        d="M5 32 L9 37 L13 32"
        stroke="rgb(255 255 255 / 0.45)"
        strokeWidth="1.25"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Re-export here for callers that want the row in isolation (kept
// internal-only for now but stable as the public surface grows).
export type { TrustZone, TopologyNode };
