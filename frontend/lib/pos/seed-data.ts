// Ports src/clients/mock_restaurant_client.py:103-276 (product + table seeds).

import type { OrderLine, Table, TableContent } from "@/lib/types";
import tableDetail1 from "@/lib/fixtures/table-detail-1.json";
import tableDetail2 from "@/lib/fixtures/table-detail-2.json";
import tableDetail5 from "@/lib/fixtures/table-detail-5.json";
import tableDetail12 from "@/lib/fixtures/table-detail-12.json";
import { DEMO_EMPLOYEE_ID } from "./constants";
import { mulberry32, seededInt, seededPick } from "./prng";

export type Product = { id: number; name: string };

export const PRODUCTS: Product[] = [
  { id: 2001, name: "Picanha na Chapa" },
  { id: 2002, name: "Costela de Cordeiro" },
  { id: 2003, name: "Fraldinha Grelhada" },
  { id: 2004, name: "Asinha de Frango" },
  { id: 2005, name: "Linguiça Artesanal" },
  { id: 2006, name: "Bife de Ancho" },
  { id: 2007, name: "Maminha Assada" },
  { id: 2008, name: "Espetinho Misto" },
  { id: 2009, name: "Churrasco de Picanha" },
  { id: 2010, name: "Tábua de Frios" },
  { id: 2011, name: "Salada Caesar com Frango" },
  { id: 2012, name: "Risoto de Cogumelos" },
  { id: 2013, name: "Moqueca de Peixe" },
  { id: 2014, name: "Feijoada Completa" },
  { id: 2015, name: "Bacalhau à Brás" },
  { id: 2016, name: "Camarão na Moranga" },
  { id: 2017, name: "Bobó de Camarão" },
  { id: 2018, name: "Pudim de Leite" },
  { id: 2019, name: "Brigadeiro Gourmet" },
  { id: 2020, name: "Quindim Tradicional" },
  { id: 3001, name: "Chopp Pilsen 300ml" },
  { id: 3002, name: "Caipirinha de Limão" },
];

type RawFixture = { table: TableContent };

const rawFixtures: readonly RawFixture[] = [
  tableDetail1 as unknown as RawFixture,
  tableDetail2 as unknown as RawFixture,
  tableDetail5 as unknown as RawFixture,
  tableDetail12 as unknown as RawFixture,
];

function cloneOrderLines(lines: readonly OrderLine[]): OrderLine[] {
  return lines.map((line) => ({ ...line }));
}

function cloneContent(content: TableContent): TableContent {
  return { ...content, content: cloneOrderLines(content.content) };
}

export const CURATED_CONTENT: Record<number, TableContent> = Object.freeze(
  rawFixtures.reduce<Record<number, TableContent>>((acc, fx) => {
    acc[fx.table.id] = cloneContent(fx.table);
    return acc;
  }, {}),
);

export const CURATED_IDS: readonly number[] = [1, 2, 5, 12];

export function seedAllTables(): Table[] {
  const curatedStatus = new Map<number, number>();
  for (const id of CURATED_IDS) {
    const curated = CURATED_CONTENT[id];
    if (curated) {
      curatedStatus.set(id, curated.status as number);
    }
  }

  const tables: Table[] = [];
  for (let id = 1; id <= 99; id += 1) {
    const rng = mulberry32(id);
    const r = rng();
    let status: number;
    if (r < 0.33) status = 0;
    else if (r < 0.7) status = 1;
    else status = 2;

    const forced = curatedStatus.get(id);
    if (forced !== undefined) {
      status = forced;
    }

    const freeTable = status === 0;
    const initialUser = seededInt(rng, 0, 20);

    tables.push({
      id,
      name: String(id),
      status,
      lockDescription: null,
      inactive: false,
      freeTable,
      initialUser,
    });
  }
  return tables;
}

function paddedGuid(tableId: number, index: number, productId: number): string {
  const base = `${tableId}-${index}-${productId}`;
  return base.padEnd(36, "0");
}

export function seedProceduralContent(
  tableId: number,
  status: number = 1,
): TableContent {
  const rng = mulberry32(tableId + 1_000_000);
  const numOrders = seededInt(rng, 2, 6);

  const orders: OrderLine[] = [];
  let total = 0;
  for (let i = 0; i < numOrders; i += 1) {
    const product = seededPick(rng, PRODUCTS);
    const quantity = seededInt(rng, 1, 2);
    const price = 20 + (product.id % 7) * 12;
    const lineTotal = quantity * price;
    orders.push({
      itemId: String(product.id),
      itemType: 0,
      parentPosition: -1,
      quantity,
      price,
      additionalInfo: null,
      guid: paddedGuid(tableId, i, product.id),
      employee: DEMO_EMPLOYEE_ID,
      time: 1737394800123,
      lineLevel: 0,
      ratio: 1,
      total: lineTotal,
      lineDiscount: 0,
      completed: true,
      parentGuid: "00000000-0000-0000-0000-000000000000",
      itemName: product.name,
    });
    total += lineTotal;
  }

  return {
    id: tableId,
    status,
    tableLocation: null,
    content: orders,
    total,
    globalDiscount: 0,
  };
}
