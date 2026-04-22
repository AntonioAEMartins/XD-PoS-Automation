import type { OrderLine } from "@/lib/types";

import {
  ACTION,
  APP_VERSION,
  DEFAULT_LIMIT,
  DEMO_TOKEN,
  DEMO_USER_ID,
  EOM,
  EQ,
  FIELD,
  MESSAGE_TYPE,
  NP,
  OPCODE,
  PROTOCOL_V1,
  PROTOCOL_V2,
} from "@/lib/pos/constants";
import { encodeBase64Json } from "@/lib/pos/encoding";
import { uuid } from "@/lib/pos/uuid";

// Ports src/builders/pos_message_builder.py:11–370. Sync API — the Python was
// async only to await the token manager; we inline DEMO_TOKEN.

type OrderForQueue = {
  completed: boolean;
  employee: number;
  id: number;
  itemId: string;
  itemType: number;
  lineDiscount: number;
  lineLevel: number;
  parentPosition: number;
  price: number;
  quantity: number;
  ratio: number;
  time: number;
  total: number;
};

function transformOrder(order: OrderLine): OrderForQueue {
  return {
    completed: order.completed ?? false,
    employee: order.employee ?? 0,
    id: 0,
    itemId: order.itemId ?? "",
    itemType: order.itemType ?? 0,
    lineDiscount: order.lineDiscount ?? 0,
    lineLevel: order.lineLevel ?? 0,
    parentPosition: order.parentPosition ?? -1,
    price: order.price ?? 0,
    quantity: order.quantity ?? 1,
    ratio: order.ratio ?? 1,
    time: 0,
    total: order.total ?? 0,
  };
}

export class MessageBuilder {
  private static _instance: MessageBuilder | null = null;

  static getInstance(): MessageBuilder {
    if (!MessageBuilder._instance) {
      MessageBuilder._instance = new MessageBuilder();
    }
    return MessageBuilder._instance;
  }

  private addParam(key: string, value: string): string {
    return `${NP}${key}${EQ}${value}`;
  }

  private encodeQueue(data: unknown): string {
    return encodeBase64Json(data);
  }

  buildMessage(
    opcode: string,
    messageType: string,
    params: Record<string, string>
  ): string {
    if (!(FIELD.MESSAGE_ID in params)) {
      params[FIELD.MESSAGE_ID] = uuid();
    }
    params[FIELD.MESSAGE_TYPE] = messageType;
    params[FIELD.TOKEN] = DEMO_TOKEN;

    const parts: string[] = [opcode];

    if (opcode !== OPCODE.POST_QUEUE) {
      params[FIELD.USER_ID] = DEMO_USER_ID;
      params[FIELD.PROTOCOL_VERSION] = PROTOCOL_V1;
      for (const [k, v] of Object.entries(params)) {
        parts.push(this.addParam(k, v));
      }
    } else {
      if (!(FIELD.PROTOCOL_VERSION in params)) {
        params[FIELD.PROTOCOL_VERSION] = PROTOCOL_V2;
      }
      parts.push(this.addParam(FIELD.PROTOCOL_VERSION, params[FIELD.PROTOCOL_VERSION]));
      parts.push(this.addParam(FIELD.QUEUE, params[FIELD.QUEUE]));
      parts.push(this.addParam(FIELD.TOKEN, params[FIELD.TOKEN]));
      parts.push(this.addParam(FIELD.MESSAGE_TYPE, params[FIELD.MESSAGE_TYPE]));
      parts.push(this.addParam(FIELD.MESSAGE_ID, params[FIELD.MESSAGE_ID]));
    }

    parts.push(EOM);
    return parts.join("");
  }

  buildGetBoardContent(boardId: string | number, requestType: number = 1): string {
    return this.buildMessage(OPCODE.GET_BOARD_CONTENT, MESSAGE_TYPE.GET_BOARD_CONTENT, {
      [FIELD.BOARD_ID]: String(boardId),
      [FIELD.TYPE]: String(requestType),
    });
  }

  buildGetDataList(
    objectType: string,
    part: number = 0,
    limit: number = DEFAULT_LIMIT,
    messageId?: string
  ): string {
    const params: Record<string, string> = {
      [FIELD.OBJECT_TYPE]: objectType,
      [FIELD.PART]: String(part),
      [FIELD.LIMIT]: String(limit),
    };
    if (messageId) params[FIELD.MESSAGE_ID] = messageId;
    return this.buildMessage(OPCODE.GET_DATA_LIST, MESSAGE_TYPE.GET_DATA_LIST, params);
  }

  buildPrebillMessage(
    employeeId: number,
    tableId: number,
    _orders: OrderLine[],
    guid?: string
  ): string {
    const queueData = {
      appVersion: APP_VERSION,
      employeeId,
      guid: guid ?? uuid(),
      id: 8,
      orders: [],
      personsNumber: 0,
      status: 1,
      table: tableId,
      time: Date.now(),
      Action: ACTION.PREBILL,
    };
    return this.buildMessage(OPCODE.POST_QUEUE, MESSAGE_TYPE.POST_ACTION, {
      [FIELD.QUEUE]: this.encodeQueue(queueData),
      [FIELD.PROTOCOL_VERSION]: PROTOCOL_V2,
    });
  }

  buildAddItemMessage(
    employeeId: number,
    tableId: number,
    orders: OrderLine[],
    guid?: string
  ): string {
    const queueData = {
      appVersion: APP_VERSION,
      employeeId,
      guid: guid ?? uuid(),
      id: 4,
      orders: orders.map(transformOrder),
      personsNumber: 1,
      status: 1,
      table: tableId,
      tableLocation: [0, 0],
      time: Date.now(),
      Action: ACTION.ADD_ITEM,
    };
    return this.buildMessage(OPCODE.POST_QUEUE, MESSAGE_TYPE.POST_ACTION, {
      [FIELD.QUEUE]: this.encodeQueue(queueData),
      [FIELD.PROTOCOL_VERSION]: PROTOCOL_V2,
    });
  }

  buildCloseTableMessage(employeeId: number, tableId: number, guid?: string): string {
    const queueData = {
      appVersion: APP_VERSION,
      additionalInfo: "1",
      customerData: {},
      employeeId,
      guid: guid ?? uuid(),
      id: 13,
      orders: [],
      personsNumber: 0,
      status: 1,
      table: tableId,
      time: Date.now(),
      Action: ACTION.CLOSE,
    };
    return this.buildMessage(OPCODE.POST_QUEUE, MESSAGE_TYPE.POST_ACTION, {
      [FIELD.QUEUE]: this.encodeQueue(queueData),
      [FIELD.PROTOCOL_VERSION]: PROTOCOL_V2,
    });
  }
}
