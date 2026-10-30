import type {
  WebBookmarkInput,
  WebBookmarkItem,
} from "./bookmarkTypes";
import {
  extractDomainFromUrl,
  mergeWebBookmarkSets,
  normalizeBookmarkUrl,
} from "./bookmarkStorage";
import type { BookmarkOrganizationUpdate } from "./organizeBookmarksWithAI";

export function buildWebBookmarkItem(
  input: WebBookmarkInput,
): WebBookmarkItem | null {
  const normalizedUrl = normalizeBookmarkUrl(input.url);
  if (!normalizedUrl) return null;
  const domain = input.domain?.trim() || extractDomainFromUrl(normalizedUrl);
  const addedAt = input.addedAt ?? Date.now();
  const cleanTags = input.tags
    ?.map((t) => t.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean);

  return {
    id: `link_${addedAt}_${Math.random().toString(36).slice(2, 8)}`,
    url: input.url.trim(),
    title: input.title?.trim() || domain || normalizedUrl,
    addedAt,
    ...(domain ? { domain } : {}),
    ...(input.description?.trim()
      ? { description: input.description.trim() }
      : {}),
    ...(input.folder?.trim() ? { folder: input.folder.trim() } : {}),
    ...(cleanTags && cleanTags.length > 0 ? { tags: cleanTags } : {}),
    ...(input.favicon?.trim() ? { favicon: input.favicon.trim() } : {}),
  };
}

export function patchWebBookmarkList(
  items: readonly WebBookmarkItem[],
  id: string,
  patch: Partial<
    Pick<WebBookmarkItem, "title" | "url" | "folder" | "tags" | "description">
  >,
): WebBookmarkItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const nextUrl = patch.url ? patch.url.trim() : item.url;
    const nextDomain = patch.url ? extractDomainFromUrl(nextUrl) : item.domain;
    return {
      ...item,
      ...patch,
      url: nextUrl,
      title:
        patch.title !== undefined
          ? patch.title.trim() || item.title
          : item.title,
      folder:
        patch.folder !== undefined
          ? patch.folder.trim() || undefined
          : item.folder,
      description:
        patch.description !== undefined
          ? patch.description.trim() || undefined
          : item.description,
      domain: nextDomain,
    };
  });
}

export function applyOrganizationUpdatesToList(
  items: readonly WebBookmarkItem[],
  updates: readonly BookmarkOrganizationUpdate[],
): WebBookmarkItem[] {
  const updateMap = new Map(updates.map((u) => [u.id, u]));
  return items.map((item) => {
    const u = updateMap.get(item.id);
    if (!u) return item;
    return {
      ...item,
      folder: u.folder || item.folder,
      tags: u.tags.length > 0 ? u.tags : item.tags,
    };
  });
}

export { mergeWebBookmarkSets };
