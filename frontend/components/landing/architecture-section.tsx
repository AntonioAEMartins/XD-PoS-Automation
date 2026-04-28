import { DecompiledCode } from "./decompiled-code";
import { DeploymentTopology } from "./deployment-topology";
import { PacketInspector } from "./packet-inspector";

type Phase = {
  number: string;
  title: string;
  summary: string;
  detail: string;
};

const PHASES: Phase[] = [
  {
    number: "A",
    title: "Intercept",
    summary: "Sit between the handheld and the LAN.",
    detail:
      "A laptop on shop Wi-Fi, rewriting the handheld's gateway and DNS so every packet it sent or received crossed an interface we controlled. An HTTPS proxy terminated the cloud calls where it could. The PDV we never touched."
  },
  {
    number: "B",
    title: "Decompile",
    summary: "APK over desktop binary. Always.",
    detail:
      "The Android handheld app gave up more than the Windows PDV ever would. Sandbox constraints, clear socket contracts, survivable across unplugs. Decompile handed us the protocol's shape, the auth flow, the retry logic."
  },
  {
    number: "C",
    title: "Synthesize",
    summary: "A protocol nobody wrote down.",
    detail:
      "Cross-reference packet captures against the decompiled client until a minimal set of TCP messages reproduced pre-bill, split, and close. Token persistence was the pattern worth stealing: cache the credential, fall back to a full auth cycle on failure."
  },
  {
    number: "D",
    title: "Deploy",
    summary: "A FastAPI agent inside the shop LAN.",
    detail:
      "An on-premises Python agent that speaks the protocol on TCP, exposes a narrow HTTP surface, and is driven over a private tunnel by the same backend that handles the WhatsApp webhook. When the guest pays, the waiter sees the table flip."
  }
];

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-14 px-6 py-24"
    >
      <header className="flex flex-col gap-6">
        <p className="eyebrow">02 / Architecture</p>
        <h2
          id="architecture-heading"
          className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl"
        >
          The solution had to work without the founders in the room.
        </h2>
        <div className="flex flex-col gap-4 text-lg leading-relaxed text-muted-foreground">
          <p className="text-pretty">
            After ~20 payments processed by hand on the floor until 2 a.m.,
            the client clearly saw the value. A new hypothesis followed:
          </p>
          <p className="font-fraunces text-[1.7rem] italic font-medium leading-[1.15] tracking-tight text-foreground sm:text-[2rem]">
            does this work when we&rsquo;re not in the room?
          </p>
          <p className="text-pretty">
            Our Achilles&rsquo; heel: the waiters&rsquo; ability to recommend
            the payment system at every table. What follows is how we took
            ourselves out of the loop.
          </p>
        </div>
      </header>

      <SequenceDiagram />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Deployment topology</p>
          <h3 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Where each piece actually lives.
          </h3>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Three trust zones, stacked. One we don&rsquo;t control, one we
            host ourselves, one we reach into over a private tunnel. Our
            backend is split across the middle two &mdash; a NestJS on an
            Oracle VM drives a Python agent we dropped on a Raspberry Pi
            inside the shop.
          </p>
        </div>

        <DeploymentTopology />
      </div>

      <PacketInspector />

      <TokenRevealHeader />

      <DecompiledCode />

      <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {PHASES.map(phase => (
          <PhaseCard key={phase.number} phase={phase} />
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
        <p className="eyebrow mb-3">What generalizes</p>
        <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/90">
          <li>
            <span className="text-foreground">Reverse-engineering a client</span>{" "}
            is often cheaper than waiting for a vendor to ship an API.
          </li>
          <li>
            <span className="text-foreground">A signed APK</span> is a narrower,
            cheaper attack surface than a compiled desktop binary.
          </li>
          <li>
            <span className="text-foreground">Token persistence</span>,
            tested against the live system, is a pattern worth reusing any
            time you sit between a cloud auth provider and a local cache.
          </li>
        </ul>
      </div>
    </section>
  );
}

function TokenRevealHeader() {
  return (
    <header className="flex flex-col gap-4">
      <p className="eyebrow">One more thing</p>
      <h3 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
        Where did the TOKEN come from?
      </h3>
      <p className="font-fraunces text-[1.7rem] italic font-medium leading-[1.15] tracking-tight text-foreground sm:text-[2rem]">
        Without it, every packet we built was a 401.
      </p>
      <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
        Captures gave us the message shape &mdash; not the credentials.
        The PDV trusted whatever TOKEN the handheld presented; the cloud
        minted it. To play the handheld convincingly, we had to find the
        minting call. APK over EXE, again.
      </p>
    </header>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  return (
    <li className="flex h-full flex-col gap-3 bg-background p-6 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Phase {phase.number}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {phase.title}
      </h3>
      <p className="text-sm text-muted-foreground">{phase.summary}</p>
      <p className="text-[13.5px] leading-relaxed text-foreground/80">
        {phase.detail}
      </p>
    </li>
  );
}

type SeqActor = { key: string; label: string; sub: string };
type SeqMessage = { from: string; to: string; label: string };

const SEQ_ACTORS: SeqActor[] = [
  { key: "guest", label: "Guest", sub: "phone" },
  { key: "whatsapp", label: "WhatsApp", sub: "messaging" },
  { key: "backend", label: "Backend", sub: "our cloud" },
  { key: "agent", label: "Agent", sub: "on-prem" },
  { key: "pdv", label: "PDV", sub: "vendor" },
  { key: "handheld", label: "Handheld", sub: "waiter" }
];

const SEQ_MESSAGES: SeqMessage[] = [
  { from: "guest", to: "whatsapp", label: "/pay" },
  { from: "whatsapp", to: "backend", label: "webhook" },
  { from: "backend", to: "agent", label: "tunnel" },
  { from: "agent", to: "pdv", label: "POSTQUEUE" },
  { from: "pdv", to: "agent", label: "OK" },
  { from: "pdv", to: "handheld", label: "state=1" }
];

function SequenceDiagram() {
  const cols = SEQ_ACTORS.length;
  const indexOf = (key: string) =>
    SEQ_ACTORS.findIndex(a => a.key === key);

  return (
    <div className="glass-panel overflow-x-auto rounded-2xl p-6 sm:p-8">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="eyebrow">A single pre-bill, in motion</p>
        <p className="mono text-[10px] text-muted-foreground">
          t &asymp; 0 &rarr; 180&nbsp;ms
        </p>
      </div>

      <div className="min-w-[560px]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {SEQ_ACTORS.map(a => (
            <div
              key={a.key}
              className="flex flex-col items-center border-b border-border pb-3"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground">
                {a.label}
              </span>
              <span className="mono mt-0.5 text-[9px] text-muted-foreground/80">
                {a.sub}
              </span>
            </div>
          ))}
        </div>

        <div className="relative mt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {SEQ_ACTORS.map(a => (
              <div key={a.key} className="flex justify-center">
                <div className="h-full w-px bg-border/70" />
              </div>
            ))}
          </div>

          <div className="relative flex flex-col gap-10 py-6">
            {SEQ_MESSAGES.map((m, i) => (
              <SequenceMessage
                key={i}
                id={i}
                fromIndex={indexOf(m.from)}
                toIndex={indexOf(m.to)}
                label={m.label}
                cols={cols}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-pretty text-sm leading-relaxed text-muted-foreground">
        Guest pays on their own phone. The waiter&rsquo;s handheld sees the
        table flip on the next poll. We&rsquo;re nowhere in this picture.
      </p>
    </div>
  );
}

function SequenceMessage({
  id,
  fromIndex,
  toIndex,
  label,
  cols
}: {
  id: number;
  fromIndex: number;
  toIndex: number;
  label: string;
  cols: number;
}) {
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  const reversed = toIndex < fromIndex;

  const leftPct = ((start + 0.5) / cols) * 100;
  const rightPct = ((end + 0.5) / cols) * 100;
  const midPct = (leftPct + rightPct) / 2;
  const markerId = `seq-arrow-${id}`;

  return (
    <div className="relative h-5">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill="rgb(255 255 255 / 0.65)"
            />
          </marker>
        </defs>
        <line
          x1={`${reversed ? rightPct : leftPct}%`}
          x2={`${reversed ? leftPct : rightPct}%`}
          y1="50%"
          y2="50%"
          stroke="rgb(255 255 255 / 0.35)"
          strokeWidth="1.25"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
      <span
        className="mono absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-border bg-card px-1.5 py-[3px] text-[10px] font-medium tracking-wider text-foreground"
        style={{ left: `${midPct}%` }}
      >
        {label}
      </span>
    </div>
  );
}
