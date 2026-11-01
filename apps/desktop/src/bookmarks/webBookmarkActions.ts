import type {
  WebBookmarkInput,
  WebBookmarkItem,
  WebBookmarkType,
} from "./bookmarkTypes";
import {
  extractDomainFromUrl,
  mergeWebBookmarkSets,
  normalizeBookmarkUrl,
} from "./bookmarkStorage";
import type { BookmarkOrganizationUpdate } from "./organizeBookmarksWithAI";

export function detectTypeFromUrl(url: string): WebBookmarkType {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(lower)) return "image";
  if (
    /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(lower) ||
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com")
  ) {
    return "video";
  }
  if (
    /\.(mp3|wav|ogg|aac|m4a|flac)(\?.*)?$/i.test(lower) ||
    lower.includes("soundcloud.com") ||
    lower.includes("spotify.com")
  ) {
    return "audio";
  }
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|rtf)(\?.*)?$/i.test(lower)) {
    return "document";
  }
  if (
    lower.includes("github.com") ||
    lower.includes("medium.com") ||
    lower.includes("substack.com") ||
    lower.includes("wikipedia.org") ||
    lower.includes("dev.to") ||
    lower.includes("news.ycombinator.com") ||
    lower.includes("behance.net")
  ) {
    return "article";
  }
  return "link";
}

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
  const type = input.type ?? detectTypeFromUrl(normalizedUrl);

  return {
    id: `link_${addedAt}_${Math.random().toString(36).slice(2, 8)}`,
    url: input.url.trim(),
    title: input.title?.trim() || domain || normalizedUrl,
    addedAt,
    type,
    ...(domain ? { domain } : {}),
    ...(input.description?.trim()
      ? { description: input.description.trim() }
      : {}),
    ...(input.folder?.trim() ? { folder: input.folder.trim() } : {}),
    ...(cleanTags && cleanTags.length > 0 ? { tags: cleanTags } : {}),
    ...(input.favicon?.trim() ? { favicon: input.favicon.trim() } : {}),
    ...(input.cover?.trim() ? { cover: input.cover.trim() } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    ...(input.highlights && input.highlights.length > 0
      ? { highlights: input.highlights }
      : {}),
    ...(input.trashed !== undefined ? { trashed: input.trashed } : {}),
  };
}

export function patchWebBookmarkList(
  items: readonly WebBookmarkItem[],
  id: string,
  patch: Partial<
    Pick<
      WebBookmarkItem,
      | "title"
      | "url"
      | "folder"
      | "tags"
      | "description"
      | "cover"
      | "type"
      | "note"
      | "highlights"
      | "trashed"
    >
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
