import type { BookmarkItem, WebBookmarkItem } from "./bookmarkTypes";
import { normalizeBookmarkUrl } from "./bookmarkStorage";

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
    } else if (item.addedAt >= existing.addedAt) {
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

  return Array.from(map.values());
}

export function mergeWebBookmarkSets(
  local: readonly WebBookmarkItem[],
  remote: readonly WebBookmarkItem[],
): WebBookmarkItem[] {
  const map = new Map<string, WebBookmarkItem>();

  for (const item of local) {
    const key = normalizeBookmarkUrl(item.url) || item.url;
    map.set(key, { ...item });
  }

  for (const item of remote) {
    const key = normalizeBookmarkUrl(item.url) || item.url;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item });
    } else {
      const mergedTags = Array.from(
        new Set([...(existing.tags ?? []), ...(item.tags ?? [])]),
      );
      const primary = item.addedAt >= existing.addedAt ? item : existing;
      const secondary = item.addedAt >= existing.addedAt ? existing : item;
      map.set(key, {
        ...secondary,
        ...primary,
        id: existing.id,
        folder: primary.folder ?? secondary.folder,
        description: primary.description ?? secondary.description,
        favicon: primary.favicon ?? secondary.favicon,
        ...(mergedTags.length > 0 ? { tags: mergedTags } : {}),
      });
    }
  }

  return Array.from(map.values());
}
