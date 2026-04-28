export type FloorStatus = "free" | "occupied" | "paid";

export type FloorOrder = {
  name: string;
  qty: number;
  price: number;
};

export type FloorAction = {
  label: string;
  description: string;
};

export type FloorTable = {
  id: number;
  name: string;
  /** A short label like "sidewalk", "inside", "garden" used by the side panel. */
  zone: string;
  /** SVG center x */
  cx: number;
  /** SVG center y */
  cy: number;
  /** Square side or circle diameter. Default 24. */
  size?: number;
  shape?: "square" | "circle";
  seats: number;
  status: FloorStatus;
  party?: number;
  orders?: readonly FloorOrder[];
  paidAt?: string;
  paymentMethod?: string;
};

const ORDERS_DRINKS: readonly FloorOrder[] = [
  { name: "Negroni", qty: 2, price: 13 },
  { name: "Old fashioned", qty: 1, price: 14 },
  { name: "Olives & focaccia", qty: 1, price: 7 }
];

const ORDERS_LIGHT: readonly FloorOrder[] = [
  { name: "Espresso", qty: 2, price: 4 },
  { name: "Almond croissant", qty: 1, price: 6 }
];

const ORDERS_BRUNCH: readonly FloorOrder[] = [
  { name: "Eggs benedict", qty: 2, price: 16 },
  { name: "Avocado toast", qty: 1, price: 13 },
  { name: "Mimosa", qty: 2, price: 9 }
];

export const FLOOR_VIEWBOX = {
  minX: 0,
  minY: -56,
  width: 620,
  height: 516
} as const;

/**
 * The horizontal street running above the restaurant. The building's front
 * wall faces this street; the front door is on the left of the facade and
 * opens onto the sidewalk, where outdoor tables 01/02/03 line the curb.
 */
export const FLOOR_STREET = {
  /** Asphalt strip — top of street (far edge) to curb. */
  asphalt: { x: -20, y: -50, width: 660, height: 32 },
  /** Curb line separating street and sidewalk. */
  curbY: -18,
  /** Lane marking — dashed center line of the street. */
  laneY: -34,
  /** Sidewalk extends from the curb down to the building front (y=104). */
  sidewalk: { x: -20, y: -18, width: 660, height: 122 }
} as const;

/**
 * Door on the front wall — coordinates of the gap (in the top wall of the
 * building) so the swing/arrow can be drawn at the same x range.
 */
export const FLOOR_DOOR = {
  x1: 50,
  x2: 130,
  y: 104
} as const;

/**
 * SVG paths for the architectural walls.
 *
 * Currently this is the "blank canvas" stage — just a single building
 * outline with the front-door gap on the upper-left. Interior walls and
 * sub-rooms will be added as we lay out the restaurant together.
 */
export const FLOOR_WALLS = {
  /** Building outer wall with the front-door gap (x=50..130) on the top. */
  buildingOuter:
    "M 24 440 L 24 104 L 50 104 M 130 104 L 596 104 L 596 440 L 24 440",
  /**
   * Ramp from the front door — only the right wall, so the ramp opens up
   * fully to the building's left wall (the cashier sits flush against it).
   */
  hallwayWalls: "M 130 104 L 130 222",
  /**
   * L-shaped partition that splits the upper floor into three zones:
   *   - Upper floor internal (cashier side, south-west of the L)
   *   - Upper floor front (where tables 11/12/13 sit, north of the L)
   *   - External upper floor (where table 14 sits, east of the vertical leg)
   *
   * Horizontal leg: y=226, from the center x of table 11 (x=230) to the
   * center x of table 13 (x=410). Sits 38 units below table 13's bottom
   * edge, mirroring the 38-unit gap above the tables.
   * Vertical leg: x=410, from y=226 down to the back wall at y=440.
   */
  externalAreaWall: "M 230 226 L 410 226 L 410 440"
} as const;

/**
 * Cashier — drawn as a built-in structure (counter ~ size of two tables)
 * with less contrast than the dining tables to read as architecture, not as
 * an interactive table.
 */
export const FLOOR_CASHIER = {
  x: 24,
  y: 246,
  width: 28,
  height: 92
} as const;

/**
 * Garden entry stairs — span the full width of the garden, from the
 * externalAreaWall vertical leg (x=410) to the right wall (x=596). Sit at
 * y=226, marking the level change between the indoor front area and the
 * outdoor garden.
 */
export const FLOOR_STAIRS = {
  x: 410,
  y: 226,
  width: 186,
  height: 18,
  stepCount: 3
} as const;

export type FloorLabel = {
  text: string;
  x: number;
  y: number;
  size?: number;
  anchor?: "start" | "middle" | "end";
  tone?: "primary" | "secondary";
};

export const FLOOR_LABELS: readonly FloorLabel[] = [
  {
    text: "Ramp ↑",
    x: 78,
    y: 175,
    size: 12,
    anchor: "middle",
    tone: "primary"
  },
  {
    text: "Cashier",
    x: 60,
    y: 240,
    size: 12,
    anchor: "start",
    tone: "primary"
  },
  {
    text: "Upper floor",
    x: 231,
    y: 426,
    size: 12,
    anchor: "middle",
    tone: "secondary"
  }
];

/**
 * Three outdoor tables lining the sidewalk, in front of the restaurant.
 * Centered vertically in the sidewalk strip (y=-18..24). To the right of
 * the front door (x=50..80) so the entrance stays clear.
 */
export const FLOOR_TABLES: readonly FloorTable[] = [
  {
    id: 1,
    name: "01",
    zone: "sidewalk",
    cx: 230,
    cy: 43,
    size: 46,
    seats: 4,
    status: "paid",
    party: 4,
    orders: ORDERS_BRUNCH,
    paidAt: "12:42",
    paymentMethod: "WhatsApp · Pix"
  },
  {
    id: 2,
    name: "02",
    zone: "sidewalk",
    cx: 320,
    cy: 43,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 3,
    orders: ORDERS_DRINKS
  },
  {
    id: 3,
    name: "03",
    zone: "sidewalk",
    cx: 410,
    cy: 43,
    size: 46,
    seats: 2,
    status: "free"
  },

  // Upper floor — same x as 01/02/03, mirrored across the front wall (y=104)
  // so 11/12/13 sit the same distance below the wall as 01/02/03 sit above it.
  {
    id: 11,
    name: "11",
    zone: "upper-floor",
    cx: 230,
    cy: 165,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 4,
    orders: ORDERS_BRUNCH
  },
  {
    id: 12,
    name: "12",
    zone: "upper-floor",
    cx: 320,
    cy: 165,
    size: 46,
    seats: 4,
    status: "free"
  },
  {
    id: 13,
    name: "13",
    zone: "upper-floor",
    cx: 410,
    cy: 165,
    size: 46,
    seats: 2,
    status: "paid",
    party: 2,
    orders: ORDERS_LIGHT,
    paidAt: "13:08",
    paymentMethod: "WhatsApp · Pix"
  },
  {
    id: 14,
    name: "14",
    zone: "garden",
    cx: 514.5,
    cy: 165,
    size: 42,
    shape: "circle",
    seats: 2,
    status: "free"
  },

  // Garden — two tables glued to the externalAreaWall vertical leg (x=410)
  // and two glued to the right wall (x=596). Same size (46) as the
  // upper-floor squares.
  {
    id: 31,
    name: "31",
    zone: "garden",
    cx: 433,
    cy: 290,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 3,
    orders: ORDERS_DRINKS
  },
  {
    id: 32,
    name: "32",
    zone: "garden",
    cx: 433,
    cy: 380,
    size: 46,
    seats: 2,
    status: "paid",
    party: 2,
    orders: ORDERS_LIGHT,
    paidAt: "13:35",
    paymentMethod: "WhatsApp · Pix"
  },
  {
    id: 33,
    name: "33",
    zone: "garden",
    cx: 573,
    cy: 290,
    size: 46,
    seats: 4,
    status: "free"
  },
  {
    id: 34,
    name: "34",
    zone: "garden",
    cx: 573,
    cy: 380,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 4,
    orders: ORDERS_BRUNCH
  },

  // Cashier-side internal — 2x2 of tables flanking the cashier counter
  {
    id: 21,
    name: "21",
    zone: "cashier-area",
    cx: 130,
    cy: 290,
    size: 46,
    seats: 2,
    status: "paid",
    party: 2,
    orders: ORDERS_LIGHT,
    paidAt: "13:22",
    paymentMethod: "WhatsApp · Pix"
  },
  {
    id: 22,
    name: "22",
    zone: "cashier-area",
    cx: 340,
    cy: 290,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 4,
    orders: ORDERS_BRUNCH
  },
  {
    id: 23,
    name: "23",
    zone: "cashier-area",
    cx: 130,
    cy: 380,
    size: 46,
    seats: 2,
    status: "free"
  },
  {
    id: 24,
    name: "24",
    zone: "cashier-area",
    cx: 340,
    cy: 380,
    size: 46,
    seats: 4,
    status: "occupied",
    party: 3,
    orders: ORDERS_DRINKS
  }
];

export const ACTIONS_BY_STATUS: Record<FloorStatus, readonly FloorAction[]> = {
  free: [
    { label: "Open new tab", description: "Start a new order on this table." },
    { label: "Hold for reservation", description: "Block the table for a name on the book." }
  ],
  occupied: [
    { label: "Send bill via WhatsApp", description: "Push the pre-bill straight to the guest's phone." },
    { label: "Generate Pix QR", description: "One-shot QR for table-side payment." },
    { label: "Split among guests", description: "Divide the bill across the party." }
  ],
  paid: [
    { label: "Send confirmation receipt", description: "WhatsApp the guest a receipt and a thank-you." }
  ]
};

export function tableTotal(table: FloorTable): number {
  return (table.orders ?? []).reduce((sum, o) => sum + o.qty * o.price, 0);
}

export function summarizeFloor(): { paid: number; occupied: number; free: number } {
  const totals = { paid: 0, occupied: 0, free: 0 };
  for (const table of FLOOR_TABLES) {
    totals[table.status] += 1;
  }
  return totals;
}
