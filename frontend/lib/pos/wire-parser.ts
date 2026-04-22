import { EOM, EQ, NP } from "@/lib/pos/constants";
import { decodeBase64Json } from "@/lib/pos/encoding";

function stripBrackets(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && s.charAt(start) === "[") start++;
  while (end > start && s.charAt(end - 1) === "]") end--;
  return s.slice(start, end);
}

export function tryExtractField(response: string, fieldIdentifier: string): string | null {
  const start = response.indexOf(fieldIdentifier);
  if (start === -1) return null;
  const rest = response.slice(start + fieldIdentifier.length);
  const npIdx = rest.indexOf(NP);
  const eomIdx = rest.indexOf(EOM);
  const end = npIdx !== -1 ? npIdx : eomIdx;
  if (end === -1) return null;
  return rest.slice(0, end).trim();
}

export function extractField(response: string, fieldIdentifier: string): string {
  const start = response.indexOf(fieldIdentifier);
  if (start === -1) {
    throw new Error(`No ${stripBrackets(fieldIdentifier)} field found in the response`);
  }
  const rest = response.slice(start + fieldIdentifier.length);
  const npIdx = rest.indexOf(NP);
  const eomIdx = rest.indexOf(EOM);
  const end = npIdx !== -1 ? npIdx : eomIdx;
  if (end === -1) {
    throw new Error(`End of ${stripBrackets(fieldIdentifier)} field not found in the response`);
  }
  return rest.slice(0, end).trim();
}

export type ParsedRequest = {
  opcode: string;
  params: Record<string, string>;
  messageId: string;
  queuePayload?: Record<string, unknown>;
};

export function parseRequest(raw: string): ParsedRequest {
  let body = raw;
  if (body.endsWith(EOM)) body = body.slice(0, -EOM.length);
  const segments = body.split(NP);
  const opcode = segments[0] ?? "";
  const params: Record<string, string> = {};
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const eqIdx = seg.indexOf(EQ);
    if (eqIdx === -1) continue;
    const key = seg.slice(0, eqIdx);
    const value = seg.slice(eqIdx + EQ.length);
    params[key] = value;
  }
  const result: ParsedRequest = {
    opcode,
    params,
    messageId: params.MESSAGEID ?? "",
  };
  if (params.QUEUE) {
    try {
      result.queuePayload = decodeBase64Json<Record<string, unknown>>(params.QUEUE);
    } catch {
      // Leave queuePayload undefined on decode failure.
    }
  }
  return result;
}
