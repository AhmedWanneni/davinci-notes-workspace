import type { Note } from "@app/core-types";
import { parseFrontmatter, parseLinks } from "@app/indexer";

function titleFromPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "");
}

/** Build a parsed note from raw vault file bytes and the full path list for link resolution. */
export function noteFromMarkdown(
  path: string,
  raw: string,
  mtime: number,
  notePaths: readonly string[],
): Note {
  const { frontmatter, content } = parseFrontmatter(raw);
  const titleOverride = frontmatter.title;
  const title =
    typeof titleOverride === "string" && titleOverride.trim().length > 0
      ? titleOverride
      : titleFromPath(path);

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  return {
    path,
    title,
    frontmatter,
    content,
    outlinks: parseLinks(content, { notePaths, sourcePath: path }),
    tags,
    mtime,
  };
}
