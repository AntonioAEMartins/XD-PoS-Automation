"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  ACTIONS_BY_STATUS,
  FLOOR_CASHIER,
  FLOOR_LABELS,
  FLOOR_STAIRS,
  FLOOR_STREET,
  FLOOR_TABLES,
  FLOOR_VIEWBOX,
  FLOOR_WALLS,
  summarizeFloor,
  tableTotal,
  type FloorStatus,
  type FloorTable
} from "@/lib/demo/floor-plan-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<FloorStatus, string> = {
  free: "Free",
  occupied: "Open order",
  paid: "Paid"
};

type StatusVisual = {
  fill: string;
  stroke: string;
  strokeHover: string;
  number: string;
  ring: string;
  chip: string;
  dot: string;
};

const STATUS_VISUAL: Record<FloorStatus, StatusVisual> = {
  free: {
    fill: "rgba(255,255,255,0.025)",
    stroke: "rgba(255,255,255,0.22)",
    strokeHover: "rgba(255,255,255,0.55)",
    number: "rgba(255,255,255,0.55)",
    ring: "rgba(255,255,255,0.55)",
    chip: "border-white/15 text-muted-foreground",
    dot: "bg-white/40"
  },
  occupied: {
    fill: "rgba(252,211,77,0.10)",
    stroke: "rgba(252,211,77,0.55)",
    strokeHover: "rgba(252,211,77,0.85)",
    number: "rgba(254,243,199,0.95)",
    ring: "rgba(252,211,77,0.85)",
    chip: "border-amber-300/30 text-amber-200/90",
    dot: "bg-amber-300"
  },
  paid: {
    fill: "rgba(110,231,183,0.18)",
    stroke: "rgba(110,231,183,0.7)",
    strokeHover: "rgba(110,231,183,0.95)",
    number: "rgba(220,255,236,0.97)",
    ring: "rgba(110,231,183,0.95)",
    chip: "border-emerald-300/40 text-emerald-200",
    dot: "bg-emerald-300"
  }
};

export function FloorPlan() {
  const tableMap = useMemo(() => {
    const m = new Map<number, FloorTable>();
    FLOOR_TABLES.forEach(t => m.set(t.id, t));
    return m;
  }, []);

  const defaultId = useMemo(
    () =>
      FLOOR_TABLES.find(t => t.status === "paid")?.id ?? FLOOR_TABLES[0].id,
    []
  );

  const [selectedId, setSelectedId] = useState<number>(defaultId);
  const [hoverId, setHoverId] = useState<number | null>(null);

  const focused =
    (hoverId !== null ? tableMap.get(hoverId) : tableMap.get(selectedId)) ??
    tableMap.get(selectedId)!;
  const isPreview = hoverId !== null && hoverId !== selectedId;

  const summary = useMemo(summarizeFloor, []);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <div className="flex min-w-0 flex-col gap-4">
          <FloorLegend summary={summary} />
          <FloorSvg
            selectedId={selectedId}
            hoverId={hoverId}
            onHover={setHoverId}
            onSelect={setSelectedId}
          />
        </div>
        <SidePanel table={focused} isPreview={isPreview} />
      </div>
    </div>
  );
}

function FloorLegend({
  summary
}: {
  summary: { paid: number; occupied: number; free: number };
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      <LegendDot status="free" label={`Free · ${summary.free}`} />
      <LegendDot status="occupied" label={`Open order · ${summary.occupied}`} />
      <LegendDot status="paid" label={`Paid · ${summary.paid}`} />
      <span className="ml-auto mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {FLOOR_TABLES.length} tables · 2 boards
      </span>
    </div>
  );
}

function LegendDot({ status, label }: { status: FloorStatus; label: string }) {
  const visual = STATUS_VISUAL[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", visual.dot)} aria-hidden />
      {label}
    </span>
  );
}

type FloorSvgProps = {
  selectedId: number;
  hoverId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
};

function FloorSvg({ selectedId, hoverId, onHover, onSelect }: FloorSvgProps) {
  const wallStroke = "rgba(255,255,255,0.32)";
  const wallStrokeSoft = "rgba(255,255,255,0.20)";
  const labelFillPrimary = "rgba(255,255,255,0.78)";
  const labelFillSecondary = "rgba(255,255,255,0.55)";

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[radial-gradient(120%_120%_at_30%_20%,rgba(255,255,255,0.025),rgba(255,255,255,0)_60%)] p-2 sm:p-3">
      <svg
        viewBox={`${FLOOR_VIEWBOX.minX} ${FLOOR_VIEWBOX.minY} ${FLOOR_VIEWBOX.width} ${FLOOR_VIEWBOX.height}`}
        className="block w-full select-none"
        role="img"
        aria-label="Restaurant floor plan with the street running across the top"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="floor-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(255,255,255,0.025)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="sidewalk-pavers"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 18 0 L 0 0 0 18"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.4"
            />
          </pattern>
        </defs>

        {/* subtle floor grid below the building */}
        <rect
          x={FLOOR_VIEWBOX.minX}
          y={0}
          width={FLOOR_VIEWBOX.width}
          height={FLOOR_VIEWBOX.height + FLOOR_VIEWBOX.minY}
          fill="url(#floor-grid)"
        />

        {/* STREET — horizontal road running across the top */}
        <g aria-label="Street">
          {/* asphalt */}
          <rect
            x={FLOOR_STREET.asphalt.x}
            y={FLOOR_STREET.asphalt.y}
            width={FLOOR_STREET.asphalt.width}
            height={FLOOR_STREET.asphalt.height}
            fill="rgba(255,255,255,0.028)"
          />
          {/* far edge of street (top) */}
          <line
            x1={FLOOR_STREET.asphalt.x}
            x2={FLOOR_STREET.asphalt.x + FLOOR_STREET.asphalt.width}
            y1={FLOOR_STREET.asphalt.y}
            y2={FLOOR_STREET.asphalt.y}
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="0.7"
          />
          {/* lane marking — dashed center line */}
          <line
            x1={FLOOR_STREET.asphalt.x + 6}
            x2={FLOOR_STREET.asphalt.x + FLOOR_STREET.asphalt.width - 6}
            y1={FLOOR_STREET.laneY}
            y2={FLOOR_STREET.laneY}
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="0.7"
            strokeDasharray="10 8"
          />
          {/* curb (between street and sidewalk) */}
          <line
            x1={FLOOR_STREET.asphalt.x}
            x2={FLOOR_STREET.asphalt.x + FLOOR_STREET.asphalt.width}
            y1={FLOOR_STREET.curbY}
            y2={FLOOR_STREET.curbY}
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="0.9"
          />
          {/* sidewalk paver pattern */}
          <rect
            x={FLOOR_STREET.sidewalk.x}
            y={FLOOR_STREET.sidewalk.y}
            width={FLOOR_STREET.sidewalk.width}
            height={FLOOR_STREET.sidewalk.height}
            fill="url(#sidewalk-pavers)"
          />
          {/* "STREET" caption */}
          <text
            x={FLOOR_VIEWBOX.width - 16}
            y={FLOOR_STREET.asphalt.y + 14}
            fontSize="11"
            fill="rgba(255,255,255,0.6)"
            textAnchor="end"
            className="mono"
            style={{ letterSpacing: "0.20em", textTransform: "uppercase" }}
          >
            Street &rarr;
          </text>
          {/* entrance arrow + DOOR caption on the sidewalk */}
          <path
            d="M 90 76 L 90 96 M 82 88 L 90 96 L 98 88"
            fill="none"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x={90}
            y={66}
            fontSize="11"
            fill="rgba(255,255,255,0.7)"
            textAnchor="middle"
            className="mono"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            Door
          </text>
        </g>

        {/* BUILDING — outer wall (with front-door gap on the top) */}
        <path
          d={FLOOR_WALLS.buildingOuter}
          fill="none"
          stroke={wallStroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />

        {/* Ramp interior walls */}
        <path
          d={FLOOR_WALLS.hallwayWalls}
          fill="none"
          stroke={wallStrokeSoft}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />

        {/* Partition between internal upper floor and external upper area */}
        <path
          d={FLOOR_WALLS.externalAreaWall}
          fill="none"
          stroke={wallStroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />

        {/* Garden entry stairs — small flight at the top of the garden */}
        <g
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="0.7"
          strokeLinecap="round"
        >
          {Array.from({ length: FLOOR_STAIRS.stepCount + 1 }).map((_, i) => {
            const y =
              FLOOR_STAIRS.y +
              (i * FLOOR_STAIRS.height) / FLOOR_STAIRS.stepCount;
            return (
              <line
                key={i}
                x1={FLOOR_STAIRS.x}
                x2={FLOOR_STAIRS.x + FLOOR_STAIRS.width}
                y1={y}
                y2={y}
              />
            );
          })}
        </g>

        {/* Ramp slope hatching — short cross-bars suggest the slope going up */}
        <g
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.7"
          strokeLinecap="round"
        >
          <line x1={36} y1={130} x2={120} y2={130} />
          <line x1={36} y1={150} x2={120} y2={150} />
          <line x1={36} y1={170} x2={120} y2={170} />
          <line x1={36} y1={190} x2={120} y2={190} />
          <line x1={36} y1={210} x2={120} y2={210} />
        </g>

        {/* Cashier — built-in structure (low contrast, not interactive) */}
        <rect
          x={FLOOR_CASHIER.x}
          y={FLOOR_CASHIER.y}
          width={FLOOR_CASHIER.width}
          height={FLOOR_CASHIER.height}
          rx="2"
          fill="rgba(255,255,255,0.045)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.9"
        />
        {/* counter face — slightly heavier line on the customer-facing edge */}
        <line
          x1={FLOOR_CASHIER.x + FLOOR_CASHIER.width}
          x2={FLOOR_CASHIER.x + FLOOR_CASHIER.width}
          y1={FLOOR_CASHIER.y + 2}
          y2={FLOOR_CASHIER.y + FLOOR_CASHIER.height - 2}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* zone labels */}
        {FLOOR_LABELS.map(label => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            fontSize={label.size ?? 7}
            textAnchor={label.anchor ?? "start"}
            fill={
              label.tone === "secondary" ? labelFillSecondary : labelFillPrimary
            }
            className="mono"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {label.text}
          </text>
        ))}

        {/* tables — paint occupied/paid last so the glow sits on top */}
        {[...FLOOR_TABLES]
          .sort((a, b) => statusOrder(a.status) - statusOrder(b.status))
          .map(table => (
            <TableNode
              key={table.id}
              table={table}
              isSelected={table.id === selectedId}
              isHovered={table.id === hoverId}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
      </svg>
    </div>
  );
}

function statusOrder(status: FloorStatus): number {
  switch (status) {
    case "free":
      return 0;
    case "occupied":
      return 1;
    case "paid":
      return 2;
  }
}

type TableNodeProps = {
  table: FloorTable;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
};

function TableNode({
  table,
  isSelected,
  isHovered,
  onHover,
  onSelect
}: TableNodeProps) {
  const visual = STATUS_VISUAL[table.status];
  const size = table.size ?? 18;
  const half = size / 2;
  const isRound = table.shape === "circle";
  const stroke = isHovered || isSelected ? visual.strokeHover : visual.stroke;
  const strokeWidth = isSelected ? 1.4 : 1;

  const filter =
    table.status === "paid"
      ? "drop-shadow(0 0 4px rgba(110,231,183,0.55))"
      : undefined;

  const hoverPad = 4;

  return (
    <g
      onMouseEnter={() => onHover(table.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(table.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(table.id)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(table.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Table ${table.name}, ${STATUS_LABEL[table.status]}`}
      aria-pressed={isSelected}
      style={{ cursor: "pointer", outline: "none" }}
      className="focus-visible:[&>rect.hit]:stroke-white/40 focus-visible:[&>circle.hit]:stroke-white/40"
    >
      {/* invisible larger hit area for easier hover targeting */}
      {isRound ? (
        <circle
          className="hit"
          cx={table.cx}
          cy={table.cy}
          r={half + hoverPad}
          fill="transparent"
        />
      ) : (
        <rect
          className="hit"
          x={table.cx - half - hoverPad}
          y={table.cy - half - hoverPad}
          width={size + hoverPad * 2}
          height={size + hoverPad * 2}
          fill="transparent"
        />
      )}

      {/* selection halo */}
      {(isSelected || isHovered) &&
        (isRound ? (
          <circle
            cx={table.cx}
            cy={table.cy}
            r={half + 3}
            fill="none"
            stroke={visual.ring}
            strokeWidth="0.8"
            opacity={isSelected ? 0.95 : 0.55}
            style={{ pointerEvents: "none" }}
          />
        ) : (
          <rect
            x={table.cx - half - 3}
            y={table.cy - half - 3}
            width={size + 6}
            height={size + 6}
            rx="3"
            fill="none"
            stroke={visual.ring}
            strokeWidth="0.8"
            opacity={isSelected ? 0.95 : 0.55}
            style={{ pointerEvents: "none" }}
          />
        ))}

      {/* table shape */}
      {isRound ? (
        <circle
          cx={table.cx}
          cy={table.cy}
          r={half}
          fill={visual.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          style={{ filter, transition: "stroke 120ms ease, fill 120ms ease" }}
        />
      ) : (
        <rect
          x={table.cx - half}
          y={table.cy - half}
          width={size}
          height={size}
          rx="2"
          fill={visual.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          style={{ filter, transition: "stroke 120ms ease, fill 120ms ease" }}
        />
      )}

      <text
        x={table.cx}
        y={table.cy + 0.3}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.max(7, Math.round(size * 0.32))}
        fill={visual.number}
        className="mono"
        style={{ pointerEvents: "none", fontWeight: 500 }}
      >
        {table.name}
      </text>
    </g>
  );
}

function SidePanel({
  table,
  isPreview
}: {
  table: FloorTable;
  isPreview: boolean;
}) {
  const total = tableTotal(table);
  const actions = ACTIONS_BY_STATUS[table.status];
  const visual = STATUS_VISUAL[table.status];

  const measureRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      // borderBoxSize includes the inner div's padding so the animated outer
      // height matches the inner content's full rendered size. +2 covers the
      // outer's 1px top + bottom border (border-box clips otherwise).
      const blockSize =
        entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight;
      setContentHeight(blockSize + 2);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.aside
      className="self-start overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]"
      animate={{ height: contentHeight }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.28, ease: [0.32, 0.72, 0.24, 1] }
      }
    >
      <div ref={measureRef} className="flex flex-col gap-4 p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Table {table.name}
        </h4>
        <span
          className={cn(
            "mono inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]",
            visual.chip
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", visual.dot)} aria-hidden />
          {STATUS_LABEL[table.status]}
        </span>
      </div>

      <div className="flex h-4 items-center">
        <p
          className={cn(
            "text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70 transition-opacity",
            isPreview ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!isPreview}
        >
          Hovering &middot; click to lock
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
        <div className="flex flex-col gap-4">
      {table.orders && table.orders.length > 0 ? (
        <div>
          <p className="eyebrow mb-2">Orders</p>
          <ul className="flex flex-col gap-1.5">
            {table.orders.map((o, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 text-[12.5px]"
              >
                <span className="truncate text-foreground/85">
                  <span className="mono mr-1 text-muted-foreground">
                    {o.qty}&times;
                  </span>
                  {o.name}
                </span>
                <span className="mono shrink-0 text-muted-foreground">
                  ${(o.qty * o.price).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Total
            </span>
            <span className="mono text-[14px] font-semibold text-foreground">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-white/8 bg-white/[0.015] px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          No open orders. Table is available.
        </p>
      )}

      {table.status === "paid" && table.paidAt && (
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-[11.5px]">
          <p className="text-emerald-200/95">
            Paid &middot; {table.paymentMethod ?? "WhatsApp"}
          </p>
          <p className="mt-0.5 text-muted-foreground/85">
            Confirmation sent at {table.paidAt}
          </p>
        </div>
      )}
        </div>

      <div>
        <p className="eyebrow mb-2">Actions</p>
        <ul className="flex flex-col gap-1.5">
          {actions.map((a, i) => (
            <li key={a.label}>
              <button
                type="button"
                className={cn(
                  "group flex w-full flex-col items-start gap-0.5 rounded-md border border-white/5 bg-white/[0.025] px-3 py-2 text-left transition-colors",
                  "hover:border-white/15 hover:bg-white/[0.05]",
                  i === 0 && "ring-1 ring-white/10"
                )}
              >
                <span className="text-[12.5px] font-medium text-foreground">
                  {a.label}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground/85">
                  {a.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      </div>
      </div>
    </motion.aside>
  );
}
