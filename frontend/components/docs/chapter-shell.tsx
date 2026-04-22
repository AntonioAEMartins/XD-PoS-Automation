import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/docs";

type ChapterRef = Pick<Chapter, "slug" | "title" | "order">;

type ChapterShellProps = {
  chapter: Chapter;
  allChapters: Chapter[];
  previous: ChapterRef | null;
  next: ChapterRef | null;
  children: ReactNode;
};

type DocsRoute = Parameters<typeof Link>[0]["href"];

function chapterHref(slug: string): DocsRoute {
  // typedRoutes does not know about our dynamic `/docs/[slug]` at typecheck
  // time (the generated union is derived from the app router), so we cast.
  return `/docs/${slug}` as unknown as DocsRoute;
}

function formatChapterNumber(order: number): string | null {
  if (!Number.isFinite(order) || order >= 900) {
    // Placeholder / test chapters use large order values — no "Chapter NN" label.
    return null;
  }
  return `Chapter ${order.toString().padStart(2, "0")}`;
}

export function ChapterShell({
  chapter,
  allChapters,
  previous,
  next,
  children
}: ChapterShellProps) {
  const chapterNumber = formatChapterNumber(chapter.order);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-6 lg:py-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <nav
            aria-label="Chapters"
            className="sticky top-24 flex flex-col gap-1 text-sm"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Trajectory
            </p>
            <ol className="flex flex-col gap-1">
              {allChapters.map(item => {
                const isActive = item.slug === chapter.slug;
                const itemNumber = formatChapterNumber(item.order);
                return (
                  <li key={item.slug}>
                    <Link
                      href={chapterHref(item.slug)}
                      className={cn(
                        "group flex items-baseline gap-2 rounded-md px-2 py-1.5 transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className={cn(
                          "w-7 shrink-0 font-mono text-[11px] tabular-nums",
                          isActive ? "text-primary" : "text-muted-foreground/80"
                        )}
                      >
                        {itemNumber ? itemNumber.replace("Chapter ", "") : "—"}
                      </span>
                      <span className="leading-snug">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-border/60 pb-8">
            {chapterNumber ? (
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {chapterNumber}
                <span className="mx-2 text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">{chapter.title}</span>
              </p>
            ) : (
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Placeholder chapter
              </p>
            )}
            <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
              {chapter.title}
            </h1>
            {chapter.summary ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {chapter.summary}
              </p>
            ) : null}
          </header>

          <article
            className={cn(
              "prose prose-slate max-w-none pt-8",
              "prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-foreground",
              "prose-p:text-foreground/90 prose-li:text-foreground/90",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
              "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.9em] prose-code:text-foreground",
              "prose-code:before:content-none prose-code:after:content-none",
              "prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/40 prose-pre:text-sm",
              "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
              "prose-hr:border-border/60"
            )}
          >
            {children}
          </article>

          <nav
            aria-label="Chapter navigation"
            className="mt-14 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-stretch sm:justify-between"
          >
            {previous ? (
              <Link
                href={chapterHref(previous.slug)}
                className="group flex flex-1 flex-col gap-1 rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <ArrowLeft className="h-3 w-3" aria-hidden />
                  Previous
                </span>
                <span className="text-sm font-medium text-foreground">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" aria-hidden />
            )}
            {next ? (
              <Link
                href={chapterHref(next.slug)}
                className="group flex flex-1 flex-col items-end gap-1 rounded-lg border border-border/60 bg-card px-4 py-3 text-right transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Next
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" aria-hidden />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
