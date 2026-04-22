import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAllChapters } from "@/lib/docs";

type DocsRoute = Parameters<typeof Link>[0]["href"];

function chapterHref(slug: string): DocsRoute {
  // typedRoutes doesn't expose our dynamic `/docs/[slug]` statically.
  return `/docs/${slug}` as unknown as DocsRoute;
}

function formatChapterNumber(order: number): string | null {
  if (!Number.isFinite(order) || order >= 900) {
    return null;
  }
  return order.toString().padStart(2, "0");
}

export const metadata = {
  title: "Docs",
  description:
    "A case-study walkthrough: from the 50 rejections to the running agent that speaks a reverse-engineered PoS protocol."
};

export default async function DocsIndexPage() {
  const chapters = await getAllChapters();
  const realChapters = chapters.filter(c => c.order < 900);
  const placeholders = chapters.filter(c => c.order >= 900);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-14 lg:px-6 lg:py-20">
      <section className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          The trajectory
        </p>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          How a proprietary PoS was reverse-engineered from the outside in
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          A chapter-by-chapter walkthrough: the 50 restaurants that said no, the
          concierge MVP that proved demand, the MITM capture that cracked the
          protocol, the APK decompile that filled in the gaps, and the agent that
          runs in production today.
        </p>
      </section>

      {realChapters.length > 0 ? (
        <section className="mt-14">
          <h2 className="sr-only">Chapters</h2>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2">
            {realChapters.map(chapter => {
              const number = formatChapterNumber(chapter.order);
              return (
                <li key={chapter.slug} className="bg-card">
                  <Link
                    href={chapterHref(chapter.slug)}
                    className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-muted/40"
                  >
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {number ? `Chapter ${number}` : "Note"}
                    </span>
                    <h3 className="font-serif text-xl font-medium tracking-tight text-foreground">
                      {chapter.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {chapter.summary}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                      Read
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="mt-14 rounded-xl border border-dashed border-border/60 bg-card/50 p-8">
          <p className="text-sm text-muted-foreground">
            No chapters published yet. Content is authored in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              content/docs/*.mdx
            </code>
            .
          </p>
        </section>
      )}

      {placeholders.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Scratch
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {placeholders.map(chapter => (
              <li key={chapter.slug}>
                <Link
                  href={chapterHref(chapter.slug)}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span className="font-mono">{chapter.slug}</span>
                  <span className="text-muted-foreground/70">·</span>
                  <span>{chapter.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
