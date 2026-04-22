// Ports src/builders/pos_message_builder.py:13-40

export const NP = "[NP]";
export const EQ = "[EQ]";
export const EOM = "[EOM]";

export const OPCODE = {
  GET_DATA_LIST: "GETDATALIST",
  GET_DATA_LIST_RESULT: "GETDATALISTRESULT",
  GET_BOARD_CONTENT: "GETBOARDCONTENT",
  GET_BOARD_CONTENT_RESULT: "GETBOARDCONTENTRESULT",
  POST_QUEUE: "POSTQUEUE",
  POST_QUEUE_RESULT: "POSTQUEUERESULT",
  MESSAGE_ERROR: "MESSAGEERROR",
} as const;

export const MESSAGE_TYPE = {
  GET_DATA_LIST: "XDPeople.Entities.GetDataListMessage",
  POST_ACTION: "XDPeople.Entities.PostActionMessage",
  GET_BOARD_CONTENT: "XDPeople.Entities.GetBoardInfoMessage",
} as const;

export const OBJECT_TYPE = {
  BOARD_STATUS: "XDPeople.Entities.MobileBoardStatus",
  ITEM: "XDPeople.Entities.MobileItem",
  ITEM_FAMILY: "XDPeople.Entities.MobileItemFamily",
} as const;

export const FIELD = {
  MESSAGE_ID: "MESSAGEID",
  MESSAGE_TYPE: "MESSAGETYPE",
  MESSAGE_OK: "MESSAGEOK",
  MESSAGE_ERROR: "MESSAGEERROR",
  TOKEN: "TOKEN",
  USER_ID: "USERID",
  PROTOCOL_VERSION: "PROTOCOLVERSION",
  OBJECT_TYPE: "OBJECTTYPE",
  PART: "PART",
  LIMIT: "LIMIT",
  BOARD_ID: "BOARDID",
  TYPE: "TYPE",
  QUEUE: "QUEUE",
  OBJECT: "OBJECT",
  BOARD_INFO: "BOARDINFO",
  RESULT: "RESULT",
  ERROR_ID: "ERRORID",
  ERROR_DESCRIPTION: "ERRORDESCRIPTION",
} as const;

export const ACTION = {
  ADD_ITEM: 1,
  PREBILL: 3,
  CLOSE: 4,
} as const;

export const DEMO_TOKEN = "7a3f9c2e-1d4b-4f6a-9b8e-2c5d8f1a0b7c";
export const DEMO_USER_ID = "1";
export const DEMO_EMPLOYEE_ID = 6;
export const PROTOCOL_V1 = "1";
export const PROTOCOL_V2 = "2";
export const APP_VERSION = 0;
export const DEFAULT_LIMIT = 5000;
