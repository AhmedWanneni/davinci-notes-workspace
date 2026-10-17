import type { Note } from "@app/core-types";
import {
  parseFrontmatter,
  parseLinks,
  parseNoteTags,
  parseReminders,
} from "@app/indexer";
import { getFilenameStem } from "../vault/pathUtils";

/**
 * Builds a parsed Note model from raw markdown text, modified timestamp,
 * and the vault's note paths list (for wikilink candidate resolution).
 */
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
      : getFilenameStem(path);

  return {
    path,
    title,
    frontmatter,
    content,
    outlinks: parseLinks(content, { notePaths, sourcePath: path }),
    tags: parseNoteTags(frontmatter, content),
    reminders: parseReminders(raw),
    mtime,
  };
}
