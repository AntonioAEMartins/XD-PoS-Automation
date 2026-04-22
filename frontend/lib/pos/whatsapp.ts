// Pure formatter mirroring the WhatsApp bill shape in whatsapp-message-*.json.

import type { TableContent, WhatsAppResponse } from "@/lib/types";

type ConsolidatedLine = {
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

function consolidate(content: TableContent): ConsolidatedLine[] {
  const byKey = new Map<string, ConsolidatedLine>();
  const order: string[] = [];
  for (const line of content.content) {
    const name = line.itemName ?? line.itemId;
    const key = `${name}|${line.price}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += line.quantity;
      existing.total += line.total;
    } else {
      const entry: ConsolidatedLine = {
        product_name: name,
        quantity: line.quantity,
        price: line.price,
        total: line.total,
      };
      byKey.set(key, entry);
      order.push(key);
    }
  }
  return order.map((k) => byKey.get(k) as ConsolidatedLine);
}

export function formatWhatsAppMessage(
  content: TableContent,
  tableId: number,
): WhatsAppResponse {
  if (content.content.length === 0) {
    return { status: "empty", message: "Mesa sem pedidos." };
  }

  const orders = consolidate(content);
  const total = orders.reduce((sum, o) => sum + o.total, 0);

  const lines = orders
    .map(
      (o) =>
        `- ${o.quantity}x ${o.product_name}: R$ ${o.total.toFixed(2)}`,
    )
    .join("\n");

  const message =
    `Olá! Aqui está a sua conta da mesa ${tableId}:\n\n` +
    `${lines}\n\n` +
    `Total: R$ ${total.toFixed(2)}\n\n` +
    `Para pagar agora, basta responder PAGAR nesta conversa.`;

  return {
    status: "ok",
    message,
    details: {
      total,
      orders: orders.map((o) => ({
        product_name: o.product_name,
        quantity: o.quantity,
        price: o.price,
        total: o.total,
      })),
    },
  };
}
