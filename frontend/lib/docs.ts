import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

/**
 * Frontmatter shape expected at the top of every `content/docs/*.mdx` file.
 */
export type ChapterFrontmatter = {
  title: string;
  order: number;
  summary: string;
};

export type Chapter = ChapterFrontmatter & {
  slug: string;
};

export type ChapterWithContent = {
  chapter: Chapter;
  content: string;
};

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

async function readDocsDir(): Promise<string[]> {
  try {
    const entries = await fs.readdir(DOCS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith(".mdx"))
      .map(entry => entry.name);
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }
}

function parseFrontmatter(
  slug: string,
  raw: string
): ChapterWithContent {
  const parsed = matter(raw);
  const data = parsed.data as Partial<ChapterFrontmatter>;

  if (typeof data.title !== "string" || data.title.length === 0) {
    throw new Error(`Chapter "${slug}" is missing required frontmatter: title`);
  }
  if (typeof data.order !== "number" || Number.isNaN(data.order)) {
    throw new Error(`Chapter "${slug}" is missing required frontmatter: order`);
  }
  if (typeof data.summary !== "string") {
    throw new Error(`Chapter "${slug}" is missing required frontmatter: summary`);
  }

  const chapter: Chapter = {
    slug,
    title: data.title,
    order: data.order,
    summary: data.summary
  };

  return {
    chapter,
    content: parsed.content
  };
}

async function readChapter(fileName: string): Promise<ChapterWithContent> {
  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(DOCS_DIR, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return parseFrontmatter(slug, raw);
}

/**
 * Reads every `.mdx` file in `content/docs`, validates frontmatter,
 * and returns them sorted by the `order` field.
 */
export async function getAllChapters(): Promise<Chapter[]> {
  const fileNames = await readDocsDir();
  const chapters = await Promise.all(
    fileNames.map(async name => (await readChapter(name)).chapter)
  );
  return chapters.sort((a, b) => a.order - b.order);
}

/**
 * Returns the chapter with matching slug plus its raw MDX body, or `null`
 * if no chapter exists at that slug.
 */
export async function getChapterBySlug(
  slug: string
): Promise<ChapterWithContent | null> {
  const fileNames = await readDocsDir();
  const match = fileNames.find(name => name.replace(/\.mdx$/, "") === slug);
  if (!match) {
    return null;
  }
  return readChapter(match);
}
