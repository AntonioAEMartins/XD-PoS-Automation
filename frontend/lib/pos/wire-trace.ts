import type { WireTrace } from "@/lib/types";

import { formatAscii, toHex } from "@/lib/pos/encoding";

export function buildWireTrace(
  request: string,
  response: string,
  payloads?: Record<string, unknown>,
  posMessage?: string
): WireTrace {
  return {
    request: {
      raw: request,
      ascii: formatAscii(request),
      hex: toHex(request),
    },
    response: {
      raw: response,
      ascii: formatAscii(response),
      hex: toHex(response),
    },
    payloads: payloads ?? {},
    posMessage: posMessage ?? request,
  };
}
