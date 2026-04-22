"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type NodeId = "android" | "proxy" | "cloud" | "pos";

type NodeDefinition = {
  id: NodeId;
  label: string;
  sub: string;
  x: number;
  y: number;
  observable: string[];
  headline: string;
};

const NODES: NodeDefinition[] = [
  {
    id: "android",
    label: "Android handheld",
    sub: "Vendor-signed APK",
    x: 80,
    y: 180,
    headline: "What the handheld exposed",
    observable: [
      "APK installable as user app — no root required.",
      "Cleartext preferences file with a device UUID and POS session token.",
      "Outbound TLS to the vendor cloud pinned to a vendor CA; most proxies rejected."
    ]
  },
  {
    id: "proxy",
    label: "Local proxy",
    sub: "Laptop on the shop Wi-Fi",
    x: 360,
    y: 60,
    headline: "What the proxy saw",
    observable: [
      "HTTPS traffic to the cloud — pinned on production devices, readable on a debug build.",
      "Plain TCP on port 10401 to the in-store PDV, never TLS.",
      "Concurrent sessions tagged by the Android UUID, so one handheld maps to one token."
    ]
  },
  {
    id: "cloud",
    label: "Vendor cloud",
    sub: "Auth + catalog + reports",
    x: 640,
    y: 180,
    headline: "What the cloud controlled",
    observable: [
      "Issues a short-lived session token after APK handshake.",
      "Authoritative menu, prices, and closing rules — not the live tables.",
      "Silent — never talks to the PDV directly; handhelds mediate every write."
    ]
  },
  {
    id: "pos",
    label: "In-store PDV",
    sub: "Windows kiosk on the LAN",
    x: 360,
    y: 320,
    headline: "What the PDV revealed",
    observable: [
      "Plain TCP framing: `[NP]KEY=VALUE[EOM]` with base64 payloads for opaque blobs.",
      "No authentication on the local socket — any device on the Wi-Fi can talk to it.",
      "Source of truth for table state, locks, and the pre-bill totals."
    ]
  }
];

type LinkKind = "tls" | "tcp";

type Link = {
  from: NodeId;
  to: NodeId;
  kind: LinkKind;
  label: string;
  /** Pixel animation delay so packet dots don't overlap visually. */
  delay: number;
};

const LINKS: Link[] = [
  { from: "android", to: "proxy", kind: "tls", label: "HTTPS", delay: 0 },
  { from: "proxy", to: "cloud", kind: "tls", label: "HTTPS (pinned)", delay: 0.9 },
  { from: "proxy", to: "pos", kind: "tcp", label: "Plain TCP + base64", delay: 1.7 }
];

function findNode(id: NodeId) {
  const node = NODES.find(n => n.id === id);
  if (!node) {
    throw new Error(`Unknown MITM node: ${id}`);
  }
  return node;
}

function nodePoint(id: NodeId, edge: "left" | "right" | "top" | "bottom") {
  const node = findNode(id);
  const width = 160;
  const height = 64;
  switch (edge) {
    case "left":
      return { x: node.x - width / 2, y: node.y };
    case "right":
      return { x: node.x + width / 2, y: node.y };
    case "top":
      return { x: node.x, y: node.y - height / 2 };
    case "bottom":
      return { x: node.x, y: node.y + height / 2 };
  }
}

function linkEdge(
  from: NodeId,
  to: NodeId,
  which: "from" | "to"
): "left" | "right" | "top" | "bottom" {
  const fromNode = findNode(from);
  const toNode = findNode(to);
  const target = which === "from" ? toNode : fromNode;
  const source = which === "from" ? fromNode : toNode;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "bottom" : "top";
}

type MitmDiagramProps = {
  className?: string;
  initialNode?: NodeId;
};

export function MitmDiagram({
  className,
  initialNode = "proxy"
}: MitmDiagramProps) {
  const [active, setActive] = useState<NodeId>(initialNode);
  const activeNode = useMemo(() => findNode(active), [active]);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur",
        className
      )}
    >
      <style>{`
        @keyframes mitm-packet {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        .mitm-dash {
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: mitm-dash-reveal 1.1s ease-out forwards;
        }
        @keyframes mitm-dash-reveal {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="relative">
          <svg
            viewBox="0 0 760 400"
            role="img"
            aria-label="Diagram of the MITM capture: Android handheld, local proxy, vendor cloud, and in-store PDV."
            className="h-auto w-full"
          >
            <defs>
              <marker
                id="mitm-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground))" />
              </marker>
            </defs>

            {LINKS.map(link => {
              const fromSide = linkEdge(link.from, link.to, "from");
              const toSide = linkEdge(link.from, link.to, "to");
              const a = nodePoint(link.from, fromSide);
              const b = nodePoint(link.to, toSide);
              const dashed = link.kind === "tls";
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
              const keyBase = `${link.from}-${link.to}`;
              return (
                <g key={keyBase}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity={0.55}
                    strokeWidth={1.5}
                    strokeDasharray={dashed ? "6 6" : undefined}
                    className="mitm-dash"
                    markerEnd="url(#mitm-arrow)"
                  />
                  <circle
                    r={3.5}
                    fill="hsl(var(--primary))"
                    style={
                      {
                        offsetPath: `path('${path}')`,
                        offsetRotate: "0deg",
                        animation: `mitm-packet 2.8s ${link.delay}s ease-in-out infinite`
                      } as React.CSSProperties
                    }
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    {link.label}
                  </text>
                </g>
              );
            })}

            {NODES.map(node => {
              const isActive = node.id === active;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - 80}, ${node.y - 32})`}
                  onClick={() => setActive(node.id)}
                  className="cursor-pointer"
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`Show what the ${node.label} revealed`}
                  tabIndex={0}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActive(node.id);
                    }
                  }}
                >
                  <rect
                    width={160}
                    height={64}
                    rx={14}
                    className={cn(
                      "transition-all duration-300",
                      isActive
                        ? "fill-primary/15 stroke-primary"
                        : "fill-card stroke-border"
                    )}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={80}
                    y={28}
                    textAnchor="middle"
                    className={cn(
                      "fill-foreground",
                      isActive && "font-semibold"
                    )}
                    style={{ fontSize: 13 }}
                  >
                    {node.label}
                  </text>
                  <text
                    x={80}
                    y={46}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    {node.sub}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-6 border-t border-dashed border-muted-foreground/80"
              />
              TLS (pinned on device)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-6 bg-muted-foreground/80"
              />
              Plain TCP
            </span>
            <span className="ml-auto hidden sm:inline">
              Click any node to reveal what that layer exposed.
            </span>
          </div>
        </div>

        <aside className="rounded-xl border bg-muted/40 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {activeNode.label}
          </div>
          <h4 className="mt-1 text-base font-semibold text-foreground">
            {activeNode.headline}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85">
            {activeNode.observable.map(item => (
              <li key={item} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {NODES.map(node => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActive(node.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                  node.id === active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <div className="font-medium">{node.label}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {node.sub}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function MitmDiagramDemo() {
  return <MitmDiagram />;
}
