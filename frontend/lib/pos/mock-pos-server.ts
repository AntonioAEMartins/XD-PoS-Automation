// In-process stand-in for 192.168.15.100:8978. Accepts a wire request string
// and returns a wire response string in the exact GETDATALISTRESULT /
// GETBOARDCONTENTRESULT / POSTQUEUERESULT / MESSAGEERROR shapes the Python
// backend would produce.

import {
  ACTION,
  EOM,
  EQ,
  FIELD,
  NP,
  OBJECT_TYPE,
  OPCODE,
} from "@/lib/pos/constants";
import { encodeBase64Json } from "@/lib/pos/encoding";
import { parseRequest, type ParsedRequest } from "@/lib/pos/wire-parser";
import { StateStore } from "@/lib/pos/state-store";
import { PRODUCTS } from "@/lib/pos/seed-data";

function param(key: string, value: string): string {
  return `${NP}${key}${EQ}${value}`;
}

function errorResponse(
  messageId: string,
  errorId: number,
  description: string
): string {
  return (
    OPCODE.MESSAGE_ERROR +
    param(FIELD.MESSAGE_ID, messageId) +
    param(FIELD.ERROR_ID, String(errorId)) +
    param(FIELD.ERROR_DESCRIPTION, description) +
    EOM
  );
}

function ok(kind: "list" | "board" | "post", req: ParsedRequest, payload?: string): string {
  if (kind === "list") {
    return (
      OPCODE.GET_DATA_LIST_RESULT +
      param(FIELD.MESSAGE_ID, req.messageId) +
      param(FIELD.OBJECT, payload ?? "") +
      param(FIELD.MESSAGE_OK, "true") +
      EOM
    );
  }
  if (kind === "board") {
    return (
      OPCODE.GET_BOARD_CONTENT_RESULT +
      param(FIELD.MESSAGE_ID, req.messageId) +
      param(FIELD.BOARD_INFO, payload ?? "") +
      param(FIELD.MESSAGE_OK, "true") +
      EOM
    );
  }
  return (
    OPCODE.POST_QUEUE_RESULT +
    param(FIELD.MESSAGE_ID, req.messageId) +
    param(FIELD.MESSAGE_OK, "true") +
    param(FIELD.RESULT, "OK") +
    EOM
  );
}

export class MockPoSServer {
  private static _instance: MockPoSServer | null = null;

  static getInstance(): MockPoSServer {
    if (!MockPoSServer._instance) {
      MockPoSServer._instance = new MockPoSServer();
    }
    return MockPoSServer._instance;
  }

  async handle(raw: string): Promise<string> {
    const req = parseRequest(raw);
    try {
      switch (req.opcode) {
        case OPCODE.GET_DATA_LIST:
          return this.handleGetDataList(req);
        case OPCODE.GET_BOARD_CONTENT:
          return this.handleGetBoardContent(req);
        case OPCODE.POST_QUEUE:
          return this.handlePostQueue(req);
        default:
          return errorResponse(req.messageId, 400, `Unknown opcode ${req.opcode}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = /não encontrada/i.test(msg)
        ? 404
        : /no orders/i.test(msg)
          ? 404
          : 500;
      return errorResponse(req.messageId, code, msg);
    }
  }

  private handleGetDataList(req: ParsedRequest): string {
    const objectType = req.params[FIELD.OBJECT_TYPE];
    if (objectType === OBJECT_TYPE.BOARD_STATUS) {
      return ok("list", req, encodeBase64Json(StateStore.getInstance().getTables()));
    }
    if (objectType === OBJECT_TYPE.ITEM || objectType === OBJECT_TYPE.ITEM_FAMILY) {
      return ok("list", req, encodeBase64Json(PRODUCTS));
    }
    return errorResponse(
      req.messageId,
      400,
      `Unsupported OBJECTTYPE ${objectType ?? "<missing>"}`
    );
  }

  private handleGetBoardContent(req: ParsedRequest): string {
    const boardIdRaw = req.params[FIELD.BOARD_ID];
    const boardId = Number(boardIdRaw);
    if (!Number.isFinite(boardId)) {
      return errorResponse(req.messageId, 400, `Invalid BOARDID ${boardIdRaw}`);
    }
    const table = StateStore.getInstance().getTable(boardId);
    if (!table) {
      return errorResponse(req.messageId, 404, "Mesa não encontrada.");
    }
    const content = StateStore.getInstance().getTableContent(boardId);
    return ok("board", req, encodeBase64Json(content));
  }

  private handlePostQueue(req: ParsedRequest): string {
    const queue = req.queuePayload as
      | {
          Action?: number;
          table?: number;
          orders?: unknown[];
        }
      | undefined;
    if (!queue) {
      return errorResponse(req.messageId, 400, "Missing or invalid QUEUE payload");
    }
    const tableId = Number(queue.table);
    if (!Number.isFinite(tableId)) {
      return errorResponse(req.messageId, 400, "QUEUE.table missing");
    }
    const store = StateStore.getInstance();
    switch (queue.Action) {
      case ACTION.PREBILL:
        store.applyPrebill(tableId);
        return ok("post", req);
      case ACTION.CLOSE:
        store.applyClose(tableId);
        return ok("post", req);
      case ACTION.ADD_ITEM: {
        const orders = Array.isArray(queue.orders)
          ? (queue.orders as unknown as Parameters<typeof store.applyAddItem>[1])
          : [];
        store.applyAddItem(tableId, orders);
        return ok("post", req);
      }
      default:
        return errorResponse(
          req.messageId,
          400,
          `Unsupported Action ${queue.Action ?? "<missing>"}`
        );
    }
  }
}
