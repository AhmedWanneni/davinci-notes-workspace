import {
  type BookmarkItem,
  type BookmarksData,
  BOOKMARKS_JSON_PATH,
} from "./bookmarkTypes";
import { readNote, withVaultWatchSuppressed, writeNote } from "../vault";

export function createEmptyBookmarksData(): BookmarksData {
  return { version: 1, bookmarks: [] };
}

export function parseBookmarks(json: string): BookmarksData {
  if (!json || !json.trim()) {
    return createEmptyBookmarksData();
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return createEmptyBookmarksData();
    }

    const rawObj = parsed as Record<string, unknown>;
    const rawBookmarks = Array.isArray(rawObj.bookmarks)
      ? rawObj.bookmarks
      : [];
    const bookmarks: BookmarkItem[] = [];

    for (const item of rawBookmarks) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec.path !== "string" || !rec.path.trim()) continue;
      const addedAt =
        typeof rec.addedAt === "number" && !Number.isNaN(rec.addedAt)
          ? rec.addedAt
          : Date.now();
      const missing = rec.missing === true ? true : undefined;

      bookmarks.push({
        path: rec.path.trim(),
        addedAt,
        ...(missing ? { missing: true } : {}),
      });
    }

    return {
      version: 1,
      bookmarks,
    };
  } catch {
    return createEmptyBookmarksData();
  }
}

export function serializeBookmarks(data: BookmarksData): string {
  return JSON.stringify(data, null, 2);
}

export function mergeBookmarkSets(
  local: readonly BookmarkItem[],
  remote: readonly BookmarkItem[],
): BookmarkItem[] {
  const map = new Map<string, BookmarkItem>();

  for (const item of local) {
    map.set(item.path, { ...item });
  }

  for (const item of remote) {
    const existing = map.get(item.path);
    if (!existing) {
      map.set(item.path, { ...item });
    } else {
      // Conflict resolution: newest addedAt wins
      if (item.addedAt >= existing.addedAt) {
        map.set(item.path, {
          path: item.path,
          addedAt: item.addedAt,
          missing: item.missing ?? existing.missing,
        });
      } else {
        map.set(item.path, {
          ...existing,
          missing: existing.missing ?? item.missing,
        });
      }
    }
  }

  return Array.from(map.values());
}

export async function loadBookmarksFile(): Promise<BookmarksData> {
  try {
    const file = await readNote(BOOKMARKS_JSON_PATH);
    return parseBookmarks(file.content);
  } catch {
    return createEmptyBookmarksData();
  }
}

export async function saveBookmarksFile(data: BookmarksData): Promise<void> {
  const content = serializeBookmarks(data);
  await withVaultWatchSuppressed(() => writeNote(BOOKMARKS_JSON_PATH, content));
}
