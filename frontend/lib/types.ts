export type TableStatus = 0 | 1 | 2 | number;

export type WireSide = {
  raw: string;
  ascii: string;
  hex: string;
};

export type WireTrace = {
  request: WireSide;
  response: WireSide;
  payloads?: Record<string, unknown>;
  posMessage?: string;
  pos_message?: string;
};

export type Table = {
  id: number;
  name: string;
  status: TableStatus;
  lockDescription?: string | null;
  inactive: boolean;
  freeTable: boolean;
  initialUser: number;
};

export type OrderLine = {
  itemId: string;
  itemType: number;
  parentPosition: number;
  quantity: number;
  price: number;
  additionalInfo?: string | null;
  guid: string;
  employee: number;
  time: number;
  lineLevel: number;
  ratio: number;
  total: number;
  lineDiscount: number;
  completed: boolean;
  parentGuid: string;
  itemName?: string;
};

export type TableContent = {
  id: number;
  name?: string;
  status: TableStatus;
  tableLocation?: string | null;
  content: OrderLine[];
  total: number;
  globalDiscount: number;
};

export type TableSummary = {
  total: number;
  open: number;
  closing: number;
  free: number;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
  start_index: number;
  end_index: number;
};

export type TablesResponse = {
  tables: Table[];
  wire_trace?: WireTrace;
  summary: TableSummary;
  pagination?: PaginationMeta;
};

export type TableContentResponse = {
  table: TableContent;
  wire_trace: WireTrace;
};

export type ActionResponse = {
  result: string;
  wire_trace: WireTrace;
};

export type WhatsAppResponse = {
  status?: string;
  message?: string;
  details?: {
    total?: number;
    orders?: Array<{
      product_name?: string;
      quantity?: number;
      price?: number;
      total?: number;
    }>;
  };
};
