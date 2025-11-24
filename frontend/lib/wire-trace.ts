import type { WireTrace } from "./types";

export function getPosMessage(trace?: WireTrace | null) {
  if (!trace) {
    return undefined;
  }
  return trace.posMessage ?? trace.pos_message ?? undefined;
}

