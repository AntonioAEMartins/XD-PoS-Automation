import type { ReactNode } from "react";

export function DiscoverySection() {
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

      <ol className="relative flex flex-col gap-10 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-border">
        <Beat date="2023">
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
        </Beat>

        <Beat date="August 2024">
          <p>
            We pivoted our software consultancy and started Astra &mdash; a
            pay-at-table solution for Brazilian restaurants.
          </p>
        </Beat>

        <Beat date="September 2024" title="Knocking on doors">
          <p>
            Racoon Smoke House. Le Pain Quotidien. Des Cucina. Camponesa. Coco
            Bambu. Empório Frutaria. FatCow. ICI. L&rsquo;Entrecôte. La
            Pastina. Lemoni. Luce. Manjericão. Ministrão. Mocha Bleu. Pobre
            Juan. Sushi Papaia. Tea Connection. Tuy Cucina. Vicoboim. Vino. Z
            Deli.
          </p>
          <p>
            But behind every door, we saw the same picture &mdash; at peak,
            nobody in the restaurant gets to do their actual job.
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
              want to be off the floor &mdash; but the second they leave, peak
              hour swallows the restaurant.
            </p>
          </div>
        </Beat>

        <Beat date="18 September 2024" title="First yes">
          <p>
            Fernando, owner of{" "}
            <RestaurantChip
              name="Cris Parrilla Bar"
              meta="Bar · Parrilla"
              addressLine1="Rua República do Iraque, 1326"
              addressLine2="São Paulo"
            >
              Cris Parrilla
            </RestaurantChip>
            , signed on as our first design partner.
          </p>
        </Beat>

        <Beat date="19 September 2024" title="On the floor">
          <p>
            One day later we were inside the restaurant, watching the pain
            happen in real time.
          </p>
        </Beat>

        <Beat title="The condition">
          <p>
            Yes came with a constraint: the PoS screen had to keep being
            right. When a guest paid through WhatsApp, waiters had to see the
            table change status on the handheld they were already carrying.
          </p>
          <p className="text-muted-foreground">
            The PoS vendor had never released an API. That constraint is the
            rest of this page.
          </p>
        </Beat>
      </ol>
    </section>
  );
}

function Beat({
  date,
  title,
  children,
}: {
  date?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <li className="relative pl-8 sm:pl-10">
      <div className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border border-border bg-background" />
      <div className="flex flex-col gap-2">
        {date && <p className="eyebrow">{date}</p>}
        {title && (
          <h3 className="text-xl font-medium tracking-tight text-foreground">
            {title}
          </h3>
        )}
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>
      </div>
    </li>
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
