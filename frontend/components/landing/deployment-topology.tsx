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
      { name: "WhatsApp automaton", meta: "finite-state machine", role: "ours" },
      { name: "Meta webhook", meta: "WhatsApp Cloud API", role: "external" }
    ]
  },
  {
    index: "03",
    label: "Shop LAN",
    control: "tunnel",
    controlNote: "we reach in over a private tunnel",
    nodes: [
      { name: "POS", meta: "Windows · vendor binary", role: "vendor" },
      { name: "Handheld", meta: "Android · waiter app", role: "vendor" },
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

const CONTROL_BADGE: Record<
  TrustZone["control"],
  { label: string; className: string }
> = {
  none: {
    label: "we never touch",
    className: "border-white/15 text-muted-foreground"
  },
  ours: {
    label: "we host",
    className: "border-foreground/40 bg-foreground/[0.08] text-foreground"
  },
  tunnel: {
    label: "we reach in",
    className: "border-foreground/25 text-foreground/85"
  }
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
        The Pi initiates the tunnel &mdash; the cloud drives the agent
        without exposing anything to the open internet.
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
    label: "isolated",
    detail: "no direct path · reached only via the POS",
    kind: "protocol"
  },
  {
    label: "Tailscale",
    detail: "private tunnel · outbound from the Pi",
    kind: "tunnel"
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
          <div className="flex w-full shrink-0 flex-row items-center gap-3 sm:w-44 sm:flex-col sm:items-start sm:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${CONTROL_DOT[zone.control]}`}
                aria-hidden
              />
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Zone {zone.index}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                {zone.label}
              </span>
              <span
                className={`mono inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2 py-[2px] text-[9px] uppercase tracking-[0.18em] ${CONTROL_BADGE[zone.control].className}`}
              >
                {CONTROL_BADGE[zone.control].label}
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
  // Vertical glyph: a directional tunnel (origin dot at the bottom →
  // single up-arrow) for outbound Tailscale, and an isolation barrier
  // for zones that don't share a path.
  if (kind === "tunnel") {
    return (
      <svg
        width="22"
        height="40"
        viewBox="0 0 22 40"
        fill="none"
        className="shrink-0"
        aria-hidden
      >
        {/* origin halo + dot at the bottom (the Pi) */}
        <circle
          cx="11"
          cy="35"
          r="6"
          stroke="rgb(229 229 229 / 0.18)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="11" cy="35" r="3" fill="rgb(229 229 229)" />
        {/* outbound shaft going up */}
        <line
          x1="11"
          y1="32"
          x2="11"
          y2="9"
          stroke="rgb(229 229 229 / 0.7)"
          strokeWidth="1.5"
        />
        {/* arrow head pointing up (toward the cloud) */}
        <path
          d="M6 10 L11 4 L16 10"
          stroke="rgb(229 229 229 / 0.95)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // Isolation: two short stubs flanking a hard barrier — no path crosses.
  return (
    <svg
      width="22"
      height="40"
      viewBox="0 0 22 40"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <line
        x1="11"
        y1="2"
        x2="11"
        y2="14"
        stroke="rgb(255 255 255 / 0.18)"
        strokeWidth="1.25"
        strokeDasharray="2 3"
      />
      <line
        x1="11"
        y1="26"
        x2="11"
        y2="38"
        stroke="rgb(255 255 255 / 0.18)"
        strokeWidth="1.25"
        strokeDasharray="2 3"
      />
      <line
        x1="3"
        y1="20"
        x2="19"
        y2="20"
        stroke="rgb(255 255 255 / 0.45)"
        strokeWidth="1.5"
      />
      <line
        x1="3"
        y1="20"
        x2="19"
        y2="20"
        stroke="rgb(255 255 255 / 0.2)"
        strokeWidth="3"
      />
    </svg>
  );
}

// Re-export here for callers that want the row in isolation (kept
// internal-only for now but stable as the public surface grows).
export type { TrustZone, TopologyNode };
