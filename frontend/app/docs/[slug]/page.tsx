import type { Metadata } from "next/types";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ChapterShell } from "@/components/docs/chapter-shell";
import { mdxComponents } from "@/components/docs/mdx-components";
import { getAllChapters, getChapterBySlug, type Chapter } from "@/lib/docs";

type PageParams = {
  params: Promise<{ slug: string }>;
};

const prettyCodeOptions = {
  theme: "github-light",
  keepBackground: false,
  defaultLang: {
    block: "plaintext",
    inline: "plaintext"
  }
} as const;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const chapters = await getAllChapters();
  return chapters.map(chapter => ({ slug: chapter.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getChapterBySlug(slug);
  if (!entry) {
    return { title: "Chapter not found" };
  }
  return {
    title: entry.chapter.title,
    description: entry.chapter.summary
  };
}

function findNeighbors(
  chapters: Chapter[],
  current: Chapter
): { previous: Chapter | null; next: Chapter | null } {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex(c => c.slug === current.slug);
  if (index === -1) {
    return { previous: null, next: null };
  }
  return {
    previous: index > 0 ? sorted[index - 1] ?? null : null,
    next: index < sorted.length - 1 ? sorted[index + 1] ?? null : null
  };
}

export default async function ChapterPage({ params }: PageParams) {
  const { slug } = await params;
  const entry = await getChapterBySlug(slug);
  if (!entry) {
    notFound();
  }

  const chapters = await getAllChapters();
  const { previous, next } = findNeighbors(chapters, entry.chapter);

  return (
    <ChapterShell
      chapter={entry.chapter}
      allChapters={chapters}
      previous={previous}
      next={next}
    >
      <MDXRemote
        source={entry.content}
        components={mdxComponents}
        options={{
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "wrap",
                  properties: {
                    className: ["group", "no-underline"]
                  }
                }
              ],
              [rehypePrettyCode, prettyCodeOptions]
            ]
          }
        }}
      />
    </ChapterShell>
  );
}
