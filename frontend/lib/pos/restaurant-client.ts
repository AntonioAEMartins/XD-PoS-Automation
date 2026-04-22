// Ports src/clients/restaurant_client.py. Orchestrates MessageBuilder →
// TCPClient → wire-parser and produces WireTrace envelopes identical in shape
// to the Python backend's output.

import type {
  Table,
  TableContent,
  WhatsAppResponse,
  WireTrace,
} from "@/lib/types";

import { DEMO_EMPLOYEE_ID, EQ, FIELD, NP, OBJECT_TYPE } from "@/lib/pos/constants";
import { decodeBase64Json } from "@/lib/pos/encoding";
import { MessageBuilder } from "@/lib/pos/message-builder";
import { StateStore } from "@/lib/pos/state-store";
import { TCPClient } from "@/lib/pos/tcp-client";
import { extractField, tryExtractField } from "@/lib/pos/wire-parser";
import { buildWireTrace } from "@/lib/pos/wire-trace";
import { formatWhatsAppMessage } from "@/lib/pos/whatsapp";

const fieldMarker = (name: string): string => `${NP}${name}${EQ}`;
const FIELD_OBJECT = fieldMarker(FIELD.OBJECT);
const FIELD_BOARD_INFO = fieldMarker(FIELD.BOARD_INFO);
const FIELD_QUEUE = fieldMarker(FIELD.QUEUE);
const FIELD_ERROR_DESCRIPTION = fieldMarker(FIELD.ERROR_DESCRIPTION);

function throwOnError(response: string): void {
  const errDesc = tryExtractField(response, FIELD_ERROR_DESCRIPTION);
  if (errDesc !== null) {
    throw new Error(errDesc);
  }
}

export class RestaurantClient {
  private static _instance: RestaurantClient | null = null;

  static getInstance(): RestaurantClient {
    if (!RestaurantClient._instance) {
      RestaurantClient._instance = new RestaurantClient();
    }
    return RestaurantClient._instance;
  }

  private get builder(): MessageBuilder {
    return MessageBuilder.getInstance();
  }

  private get tcp(): TCPClient {
    return TCPClient.getInstance();
  }

  private async sendMessage(message: string): Promise<string> {
    const response = await this.tcp.sendData(message);
    throwOnError(response);
    return response;
  }

  async fetchTables(): Promise<Table[]> {
    const { tables } = await this.fetchTablesWithTrace();
    return tables;
  }

  async fetchTablesWithTrace(): Promise<{ tables: Table[]; wireTrace: WireTrace }> {
    const message = this.builder.buildGetDataList(OBJECT_TYPE.BOARD_STATUS);
    const response = await this.sendMessage(message);
    const encoded = extractField(response, FIELD_OBJECT);
    const tables = decodeBase64Json<Table[]>(encoded);
    const wireTrace = buildWireTrace(message, response, { response_object: tables }, message);
    return { tables, wireTrace };
  }

  async fetchTableContent(tableId: number): Promise<TableContent> {
    const { table } = await this.fetchTableContentWithTrace(tableId);
    return table;
  }

  async fetchTableContentWithTrace(
    tableId: number
  ): Promise<{ table: TableContent; wireTrace: WireTrace }> {
    const message = this.builder.buildGetBoardContent(tableId);
    const response = await this.sendMessage(message);
    const encoded = extractField(response, FIELD_BOARD_INFO);
    const content = decodeBase64Json<TableContent>(encoded);
    this.enrichContent(content);
    const wireTrace = buildWireTrace(
      message,
      response,
      { response_boardinfo: content },
      message
    );
    return { table: content, wireTrace };
  }

  async prebill(tableId: number): Promise<string> {
    const { result } = await this.prebillWithTrace(tableId);
    return result;
  }

  async prebillWithTrace(
    tableId: number
  ): Promise<{ result: string; wireTrace: WireTrace }> {
    const content = await this.fetchTableContent(tableId);
    if (!content.content || content.content.length === 0) {
      throw new Error("No orders found for the table.");
    }
    const message = this.builder.buildPrebillMessage(
      DEMO_EMPLOYEE_ID,
      tableId,
      content.content
    );
    const response = await this.sendMessage(message);
    const wireTrace = this.traceWithQueue(message, response);
    return { result: "Pré-conta gerada com sucesso.", wireTrace };
  }

  async closeTable(tableId: number): Promise<string> {
    const { result } = await this.closeTableWithTrace(tableId);
    return result;
  }

  async closeTableWithTrace(
    tableId: number
  ): Promise<{ result: string; wireTrace: WireTrace }> {
    const message = this.builder.buildCloseTableMessage(DEMO_EMPLOYEE_ID, tableId);
    const response = await this.sendMessage(message);
    const wireTrace = this.traceWithQueue(message, response);
    return { result: "Mesa fechada com sucesso.", wireTrace };
  }

  async getWhatsAppMessage(tableId: number): Promise<WhatsAppResponse> {
    const content = await this.fetchTableContent(tableId);
    return formatWhatsAppMessage(content, tableId);
  }

  private traceWithQueue(message: string, response: string): WireTrace {
    const payloads: Record<string, unknown> = {};
    const encodedQueue = tryExtractField(message, FIELD_QUEUE);
    if (encodedQueue) {
      try {
        payloads.request_queue = decodeBase64Json(encodedQueue);
      } catch {
        // Leave payloads without the decoded queue if decoding fails.
      }
    }
    return buildWireTrace(message, response, payloads, message);
  }

  private enrichContent(content: TableContent): void {
    if (!Array.isArray(content.content)) return;
    const store = StateStore.getInstance();
    for (const item of content.content) {
      if (item.itemName) continue;
      const product = store.getProduct(item.itemId);
      item.itemName = product?.name ?? "Unknown Product";
    }
  }
}
