import type {
  BookmarkItem,
  WebBookmarkItem,
  WebBookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";
import type { BookmarkCounts, SidebarSection } from "./webBookmarkFilters";

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

export function computeNoteBookmarkCounts(
  items: readonly BookmarkItem[],
): BookmarkCounts {
  let all = 0;
  let unsorted = 0;
  let trash = 0;
  const colMap = new Map<string, number>();

  for (const item of items) {
    if (item.missing) {
      trash += 1;
      continue;
    }
    all += 1;
    const parts = item.path.split("/");
    parts.pop();
    const folder = parts.join("/");
    if (!folder) {
      unsorted += 1;
    } else {
      colMap.set(folder, (colMap.get(folder) ?? 0) + 1);
    }
  }

  const collections = Array.from(colMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return {
    all,
    unsorted,
    trash,
    collections,
    highlights: 0,
    links: 0,
    articles: 0,
    images: 0,
    videos: 0,
    audios: 0,
    documents: all,
    withoutTags: all,
  };
}

export function filterAndSortNoteBookmarks(
  bookmarks: readonly BookmarkItem[],
  section: SidebarSection,
  searchQuery: string,
  sortOption: WebBookmarkSortOption,
): BookmarkItem[] {
  const query = searchQuery.trim().toLowerCase();

  const filtered = bookmarks.filter((b) => {
    if (section.type === "trash") {
      if (!b.missing) return false;
    } else if (section.type === "unsorted") {
      const parts = b.path.split("/");
      parts.pop();
      if (parts.join("/")) return false;
    } else if (section.type === "collection") {
      const parts = b.path.split("/");
      parts.pop();
      if (parts.join("/") !== section.folder) return false;
    }

    if (!query) return true;
    const parts = b.path.split("/");
    const fileName = parts.pop() ?? b.path;
    const title = fileName.replace(/\.(md|canvas)$/i, "").toLowerCase();
    return title.includes(query) || b.path.toLowerCase().includes(query);
  });

  return [...filtered].sort((a, b) => {
    if (sortOption === "name-asc" || sortOption === "alpha") {
      return a.path.localeCompare(b.path);
    }
    if (sortOption === "name-desc") {
      return b.path.localeCompare(a.path);
    }
    if (sortOption === "date-asc") {
      return a.addedAt - b.addedAt;
    }
    return b.addedAt - a.addedAt;
  });
}

export function convertNotesToWebBookmarkItems(
  notes: readonly BookmarkItem[],
  notesContent: Record<string, string>,
): WebBookmarkItem[] {
  return notes.map((b) => {
    const parts = b.path.split("/");
    const fileName = parts.pop() ?? b.path;
    const folder = parts.join("/");
    const title = fileName.replace(/\.(md|canvas)$/i, "");
    const preview = notesContent[b.path]
      ? extractPreview(notesContent[b.path])
      : undefined;

    return {
      id: b.path,
      url: b.path,
      title,
      folder: folder || undefined,
      domain: "vault note",
      description: preview,
      addedAt: b.addedAt,
      trashed: b.missing,
      type: "document",
    };
  });
}
