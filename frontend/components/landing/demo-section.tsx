import { ArrowUpRight, Github } from "lucide-react";

import { FloorPlan } from "./embedded-demo/floor-plan";

const GITHUB_URL = "https://github.com/AntonioAEMartins/XD-PoS-Automation";
const PERSONAL_SITE_URL = "https://antonioaemartins.dev";

export function DemoSection() {
  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 py-24"
    >
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="eyebrow">03 / Demo</p>
        <h2
          id="demo-heading"
          className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl"
        >
          Our view of the shop, in your browser.
        </h2>
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
          The same floor we walked into every shift &mdash; about forty
          tables across an inside salão and an outside terraço. A square
          lights up the moment a guest pays. Hover to scan the room; click
          to see the open orders and the action we&rsquo;d run next.
        </p>
      </header>

      <FloorPlan />

      <footer className="mx-auto flex w-full max-w-3xl flex-col gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Antônio A. E. Martins. Case study
          written from project notes and the repo.
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <a
            href={PERSONAL_SITE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="link-muted inline-flex items-center gap-1"
          >
            antonioaemartins.dev
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="link-muted inline-flex items-center gap-1.5"
          >
            <Github className="h-4 w-4" aria-hidden />
            Source
          </a>
        </nav>
      </footer>
    </section>
  );
}
