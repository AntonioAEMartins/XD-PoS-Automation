import { DEMO_TOKEN } from "@/lib/pos/constants";

// Companion card to <PacketInspector />. Explains how the TOKEN
// that appears inside every TCP packet is minted against the
// HTTPS auth endpoint — the other half of the reverse-engineering
// story, distilled from xdo-java-files/.../XDApi.java.

type Param = {
  name: string;
  value: string;
  note?: string;
  emptyValue?: boolean;
};

const PARAMS: Param[] = [
  { name: "admin", value: "info@xd.pt" },
  { name: "password", value: "xd" },
  { name: "client_id", value: "mobileapps" },
  {
    name: "private_key",
    value: '""',
    emptyValue: true,
    note: "discovered empirically",
  },
];

export function HttpsStory() {
  return (
    <aside
      aria-labelledby="https-story-heading"
      className="glass-panel rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3">
        <p className="eyebrow">How the TOKEN gets minted</p>
        <h3
          id="https-story-heading"
          className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]"
        >
          The HTTPS handshake behind the TCP packet.
        </h3>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* Request line */}
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Request</p>
          <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <p className="mono text-[12.5px] leading-relaxed text-foreground/90 whitespace-nowrap">
              <span className="text-amber-200">POST</span>{" "}
              <span className="text-foreground/90">
                https://myxd1.azurewebsites.net/api/auth/login
              </span>
            </p>
          </div>
        </div>

        {/* Params */}
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Body params</p>
          <ul className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            {PARAMS.map(param => (
              <li
                key={param.name}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="mono w-28 shrink-0 text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {param.name}
                </span>
                <span
                  className={`mono text-[12.5px] leading-relaxed ${
                    param.emptyValue
                      ? "text-muted-foreground/80"
                      : "text-foreground/90"
                  }`}
                >
                  {param.value}
                </span>
                {param.note ? (
                  <span className="text-[11.5px] italic leading-relaxed text-muted-foreground sm:ml-auto">
                    {param.note}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {/* Response */}
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Response</p>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
            <p className="mono text-[12.5px] leading-relaxed text-foreground/90 break-all">
              <span className="text-emerald-300/90">TOKEN</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-emerald-100">{DEMO_TOKEN}</span>
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              &hellip; matches the{" "}
              <span className="mono text-foreground/70">TOKEN</span>
              {" "}field in the packet above.
            </p>
          </div>
        </div>

        {/* Prose footer */}
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          Discovered by decompiling{" "}
          <span className="mono text-foreground/70">XDApi.java</span>; the
          empty{" "}
          <span className="mono text-foreground/70">private_key</span> was
          trial-and-error.
        </p>
      </div>
    </aside>
  );
}
