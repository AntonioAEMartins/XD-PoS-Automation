// In-memory mirror of src/clients/mock_restaurant_client.py state transitions.

import type { OrderLine, Table, TableContent } from "@/lib/types";
import {
  CURATED_CONTENT,
  PRODUCTS,
  type Product,
  seedAllTables,
  seedProceduralContent,
} from "./seed-data";

function cloneOrderLines(lines: readonly OrderLine[]): OrderLine[] {
  return lines.map((line) => ({ ...line }));
}

function cloneContent(content: TableContent): TableContent {
  return { ...content, content: cloneOrderLines(content.content) };
}

function cloneTable(table: Table): Table {
  return { ...table };
}

function recomputeTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.total, 0);
}

let _instance: StateStore | null = null;

export class StateStore {
  private tables: Map<number, Table> = new Map();
  private contents: Map<number, TableContent> = new Map();
  private products: Map<number, Product> = new Map();

  private constructor() {
    this.seed();
  }

  public static getInstance(): StateStore {
    if (_instance === null) {
      _instance = new StateStore();
    }
    return _instance;
  }

  private seed(): void {
    this.tables.clear();
    this.contents.clear();
    this.products.clear();

    for (const product of PRODUCTS) {
      this.products.set(product.id, product);
    }

    for (const table of seedAllTables()) {
      this.tables.set(table.id, table);
    }

    for (const [idStr, content] of Object.entries(CURATED_CONTENT)) {
      const id = Number(idStr);
      this.contents.set(id, cloneContent(content));
    }
  }

  public reset(): void {
    this.seed();
  }

  public getTables(): Table[] {
    return Array.from(this.tables.values(), cloneTable);
  }

  public getTable(id: number): Table | undefined {
    const t = this.tables.get(id);
    return t ? cloneTable(t) : undefined;
  }

  public getTableContent(id: number): TableContent {
    const table = this.tables.get(id);
    const status = table?.status ?? 0;

    if (status === 0) {
      return {
        id,
        status: 0,
        tableLocation: null,
        content: [],
        total: 0,
        globalDiscount: 0,
      };
    }

    let stored = this.contents.get(id);
    if (!stored) {
      stored = seedProceduralContent(id, status);
      this.contents.set(id, stored);
    }
    return cloneContent({ ...stored, status });
  }

  public getProduct(id: number | string): Product | undefined {
    const numeric = typeof id === "string" ? Number(id) : id;
    if (!Number.isFinite(numeric)) return undefined;
    return this.products.get(numeric);
  }

  public applyPrebill(id: number): void {
    const table = this.tables.get(id);
    if (!table) {
      throw new Error("Mesa não encontrada.");
    }
    const content = this.getTableContent(id);
    if (content.content.length === 0) {
      throw new Error("No orders found for the table.");
    }
    table.status = 2;
    table.freeTable = false;
  }

  public applyClose(id: number): void {
    const table = this.tables.get(id);
    if (!table) {
      throw new Error("Mesa não encontrada.");
    }
    table.status = 0;
    table.freeTable = true;
    this.contents.delete(id);
  }

  public applyAddItem(id: number, orders: OrderLine[]): void {
    const table = this.tables.get(id);
    if (!table) {
      throw new Error("Mesa não encontrada.");
    }
    if (table.status === 0) {
      table.status = 1;
      table.freeTable = false;
    }

    const existing = this.contents.get(id);
    const base: TableContent = existing ?? {
      id,
      status: table.status,
      tableLocation: null,
      content: [],
      total: 0,
      globalDiscount: 0,
    };

    const merged: OrderLine[] = [...base.content, ...cloneOrderLines(orders)];
    this.contents.set(id, {
      ...base,
      status: table.status,
      content: merged,
      total: recomputeTotal(merged),
    });
  }
}
