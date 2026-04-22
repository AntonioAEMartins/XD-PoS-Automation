"use client";

import type { ComponentProps } from "react";

import { WireViewer } from "@/components/wire-viewer";
import type { WireTrace } from "@/lib/types";

type InlineWireViewerProps = {
  trace: WireTrace;
} & Omit<ComponentProps<typeof WireViewer>, "trace">;

/**
 * Thin, MDX-friendly wrapper around `<WireViewer />`.
 *
 * Unlike the demo console — which fetches a trace from the backend —
 * this variant takes a literal `WireTrace` prop. Raw / Base64 / ASCII
 * toggles and the Request / Response / PoS tabs are inherited from
 * the underlying viewer, so embedded captures feel identical to
 * what reviewers see on `/demo`.
 */
export function InlineWireViewer({
  trace,
  title = "Captured wire trace",
  viewerId = "inline-wire-viewer",
  className,
  ...rest
}: InlineWireViewerProps) {
  return (
    <WireViewer
      trace={trace}
      title={title}
      viewerId={viewerId}
      className={className}
      {...rest}
    />
  );
}

const DEMO_REQUEST_RAW =
  "[NP]OP=GETBOARDCONTENT[NP]TABLE=12[NP]USER=204[NP]TOKEN=e7c1...9b[EOM]";
const DEMO_REQUEST_ASCII = DEMO_REQUEST_RAW.replace(/\[NP\]/g, "• ")
  .replace(/\[EOM\]/g, " ■");

const DEMO_RESPONSE_RAW =
  "[NP]STATUS=OK[NP]ITEMS=3[NP]LINE1=Margherita|1|45.00[NP]LINE2=Caipirinha|2|28.00[NP]LINE3=Couvert|1|12.00[NP]TOTAL=113.00[EOM]";
const DEMO_RESPONSE_ASCII = DEMO_RESPONSE_RAW.replace(/\[NP\]/g, "• ")
  .replace(/\[EOM\]/g, " ■");

const DEMO_POS_MESSAGE =
  "*Table 12 — pre-bill*\n• Margherita pizza  R$45.00\n• Caipirinha ×2   R$56.00\n• Couvert            R$12.00\n\nTotal: R$113.00";

const DEMO_TRACE: WireTrace = {
  request: {
    raw: DEMO_REQUEST_RAW,
    ascii: DEMO_REQUEST_ASCII,
    hex: ""
  },
  response: {
    raw: DEMO_RESPONSE_RAW,
    ascii: DEMO_RESPONSE_ASCII,
    hex: ""
  },
  posMessage: DEMO_POS_MESSAGE
};

export function InlineWireViewerDemo() {
  return (
    <InlineWireViewer
      trace={DEMO_TRACE}
      title="Demo: pre-bill for table 12"
      viewerId="inline-wire-viewer-demo"
    />
  );
}
