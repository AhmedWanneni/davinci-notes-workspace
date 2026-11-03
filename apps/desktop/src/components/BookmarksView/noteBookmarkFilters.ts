import type {
  BookmarkItem,
  WebBookmarkItem,
} from "../../bookmarks/bookmarkTypes";

export function extractPreview(
  content: string | undefined,
): string | undefined {
  if (!content) return undefined;
  const lines = content.split("\n");
  const cleanLines: string[] = [];
  let inFrontmatter = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter || !trimmed || trimmed.startsWith("#")) continue;
    cleanLines.push(trimmed);
    if (cleanLines.length >= 2) break;
  }

  return cleanLines.length > 0 ? cleanLines.join(" ") : undefined;
}

export interface NoteBookmarkSources {
  notesContent: Record<string, string>;
  /** Maps a note path to its tag keys (from the vault tag index). */
  noteTags?: ReadonlyMap<string, ReadonlySet<string>> | null;
  /** When non-empty, bookmarked paths missing from it are treated as missing. */
  allNotePaths?: readonly string[];
}

/**
 * Adapts bookmarked vault notes to the web-link item shape so the notes page
 * reuses the exact same list/cards/headlines/moodboard views, sidebar
 * collections, filters and sorting as web links.
 */
export function convertNotesToWebBookmarkItems(
  notes: readonly BookmarkItem[],
  { notesContent, noteTags, allNotePaths }: NoteBookmarkSources,
): WebBookmarkItem[] {
  const known =
    allNotePaths && allNotePaths.length > 0 ? new Set(allNotePaths) : null;

  return notes.map((b) => {
    const parts = b.path.split("/");
    const fileName = parts.pop() ?? b.path;
    const folder = parts.join("/");
    const title = fileName.replace(/\.(md|canvas)$/i, "");
    const preview = extractPreview(notesContent[b.path]);
    const tags = Array.from(noteTags?.get(b.path) ?? []).sort();
    const missing = b.missing === true || (known !== null && !known.has(b.path));

    return {
      id: b.path,
      url: b.path,
      title,
      folder: folder || undefined,
      domain: "vault note",
      description: preview,
      ...(tags.length > 0 ? { tags } : {}),
      addedAt: b.addedAt,
      trashed: missing,
      type: "document" as const,
    };
  });
}
