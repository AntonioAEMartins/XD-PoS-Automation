"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

type BeatData = {
  id: string;
  date: string;
  title: string;
  body: ReactNode;
};

const BEATS: BeatData[] = [
  {
    id: "2023",
    date: "2023",
    title: "A pay-at-table solution, in our pockets.",
    body: (
      <p>
        We discovered a pay-at-table solution as customers in Europe and
        started seeing it in our daily lives.{" "}
        <a
          href="https://sundayapp.com"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground"
        >
          Sunday
        </a>
        .
      </p>
    ),
  },
  {
    id: "aug-2024",
    date: "August 2024",
    title: "We pivoted into Astra.",
    body: (
      <p>
        We pivoted our software consultancy and started Astra &mdash; a
        pay-at-table solution for Brazilian restaurants.
      </p>
    ),
  },
  {
    id: "sep-2024",
    date: "September 2024",
    title: "Knocking on doors. Fifty no’s before the first yes.",
    body: (
      <>
        <p>
          We started going into restaurants looking for a design partner.
          Racoon Smoke House. Le Pain Quotidien. Des Cucina. Camponesa. Coco
          Bambu. Empório Frutaria. FatCow. ICI. L&rsquo;Entrecôte. La
          Pastina. Lemoni. Luce. Manjericão. Ministrão. Mocha Bleu. Pobre
          Juan. Sushi Papaia. Tea Connection. Tuy Cucina. Vicoboim. Vino. Z
          Deli.
        </p>
        <p>
          Behind every door, the same picture &mdash; at peak, nobody in the
          restaurant gets to do their actual job.
        </p>
        <div className="flex flex-col gap-1.5 border-l border-border pl-4">
          <p>
            <span className="font-medium text-foreground">Waiters</span>{" "}
            can&rsquo;t keep up &mdash; orders, plates, checks, and
            &ldquo;where&rsquo;s my bill?&rdquo; all at the same table.
          </p>
          <p>
            <span className="font-medium text-foreground">Managers</span>{" "}
            stop managing; they step in as a fourth waiter the moment the
            rush hits.
          </p>
          <p>
            <span className="font-medium text-foreground">Owners</span>{" "}
            want to be off the floor &mdash; but the second they leave,
            peak hour swallows the restaurant.
          </p>
        </div>
        <p>
          On <span className="text-foreground">19 September</span>, Fernando
          &mdash; owner of{" "}
          <RestaurantChip
            name="Cris Parrilla Bar"
            meta="Bar · Parrilla"
            addressLine1="Rua República do Iraque, 1326"
            addressLine2="São Paulo"
          >
            Cris Parrilla
          </RestaurantChip>{" "}
          &mdash; signed on as our first design partner. One day later we
          were inside the restaurant, watching the pain happen in real
          time.
        </p>
        <p className="text-muted-foreground">
          Yes came with a constraint: the PoS screen had to keep being
          right. When a guest paid through WhatsApp, waiters had to see the
          table change status on the handheld they were already carrying.
          The PoS vendor had never released an API. That constraint is the
          rest of this page.
        </p>
      </>
    ),
  },
  {
    id: "nov-2024",
    date: "November 2024",
    title: "Two months in: the integration runs end-to-end.",
    body: (
      <>
        <p>
          A guest scans, opens WhatsApp, pays. The waiter&rsquo;s handheld
          flips the table from <em>open</em> to <em>paying</em> to{" "}
          <em>closed</em> on the next poll. Nobody walks the floor for us.
        </p>
        <p>
          Underneath: a WhatsApp bot, a finite-state machine for every
          table&rsquo;s lifecycle, a NestJS backend taking the webhook, a
          Python agent on a Raspberry Pi inside the shop driving the PDV
          over its undocumented TCP protocol, and a{" "}
          <code className="mono text-[13.5px] text-foreground">
            TokenManager
          </code>{" "}
          keeping a working session alive across restarts.
        </p>
        <p className="text-muted-foreground">
          The full PoS integration is{" "}
          <Link
            href="/docs"
            className="text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground"
          >
            the rest of the docs
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "feb-2025",
    date: "February 2025",
    title: "Five months in: the market answers back.",
    body: (
      <>
        <p>
          The technology was running. The business stopped working in three
          ways at once.
        </p>
        <div className="flex flex-col gap-3 border-l border-border pl-4">
          <p>
            <span className="font-medium text-foreground">
              The fee gap.
            </span>{" "}
            Our transactions were card-not-present. The credit-card machine
            on the counter was card-present. With the same anticipation of
            receivables, a competitive in-person rate was{" "}
            <span className="text-foreground">~3%</span>; ours was{" "}
            <span className="text-foreground">~7%</span>. We were not going
            to close that gap by writing better software.
          </p>
          <p>
            <span className="font-medium text-foreground">
              The bigger ship arriving.
            </span>{" "}
            iFood started rolling out their own in-restaurant card machine
            &mdash; one that connected delivery data to the in-person
            transaction and turned every check into a personalized loyalty
            program for the guest. A fidelity club for restaurants that
            already had iFood&rsquo;s entire customer graph on day one. We
            had a payment flow.
          </p>
          <p>
            <span className="font-medium text-foreground">
              The priority gap.
            </span>{" "}
            We were in love with this product as customers. For the
            restaurant owner, it was not in the top three things keeping
            them up at night.
          </p>
        </div>
      </>
    ),
  },
];

export function DiscoverySection() {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section
      id="discovery"
      aria-labelledby="discovery-heading"
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-14 px-6 pb-24 pt-24 sm:pt-32 lg:pt-40"
    >
      <header className="flex flex-col gap-6">
        <p className="eyebrow">01 / Discovery</p>
        <h1
          id="discovery-heading"
          className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[56px]"
        >
          Fifty no&rsquo;s before the first yes.
        </h1>
      </header>

      <ol className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-border">
        {BEATS.map(beat => (
          <Beat
            key={beat.id}
            beat={beat}
            isOpen={openIds.has(beat.id)}
            onToggle={() => toggle(beat.id)}
          />
        ))}
      </ol>
    </section>
  );
}

function Beat({
  beat,
  isOpen,
  onToggle,
}: {
  beat: BeatData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `beat-${beat.id}-panel`;
  return (
    <li className="relative pl-8 sm:pl-10">
      <span
        aria-hidden
        className={`absolute left-0 top-[18px] h-[11px] w-[11px] rounded-full border bg-background transition-colors ${
          isOpen
            ? "border-foreground/70 bg-foreground"
            : "border-border"
        }`}
      />

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="group flex w-full items-start gap-4 rounded-lg py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="eyebrow">{beat.date}</p>
          <h3 className="text-balance text-xl font-medium leading-snug tracking-tight text-foreground sm:text-[22px]">
            {beat.title}
          </h3>
        </div>
        <Chevron isOpen={isOpen} />
      </button>

      <div
        id={panelId}
        role="region"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`flex flex-col gap-3 pb-3 pt-3 text-[15px] leading-relaxed text-foreground/90 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {beat.body}
          </div>
        </div>
      </div>
    </li>
  );
}

function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-foreground/40 group-hover:text-foreground ${
        isOpen ? "rotate-180 border-foreground/40 text-foreground" : ""
      }`}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 11 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.5 4 L5.5 7 L8.5 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function RestaurantChip({
  name,
  meta,
  addressLine1,
  addressLine2,
  children,
}: {
  name: string;
  meta: string;
  addressLine1: string;
  addressLine2: string;
  children: ReactNode;
}) {
  return (
    <span className="group/chip relative inline-block">
      <span
        tabIndex={0}
        className="cursor-help text-foreground underline decoration-border decoration-dotted underline-offset-4 outline-none transition group-hover/chip:decoration-foreground group-focus-within/chip:decoration-foreground"
      >
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100 group-focus-within/chip:opacity-100"
      >
        <span className="block rounded-xl border border-border bg-card p-4 text-left shadow-xl shadow-black/20">
          <span className="block text-base font-semibold tracking-tight text-foreground">
            {name}
          </span>
          <span className="mt-1 block text-[13px] text-muted-foreground">
            {meta}
          </span>
          <span className="mt-3 block text-[13px] leading-snug text-foreground/80">
            {addressLine1}
            <br />
            {addressLine2}
          </span>
        </span>
      </span>
    </span>
  );
}
