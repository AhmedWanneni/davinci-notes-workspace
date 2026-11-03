import {
  type BookmarkItem,
  type BookmarksData,
  type WebBookmarkItem,
  BOOKMARKS_JSON_PATH,
} from "./bookmarkTypes";
import { readNote, withVaultWatchSuppressed, writeNote } from "../vault";

export function createEmptyBookmarksData(): BookmarksData {
  return { version: 1, bookmarks: [] };
}

export function normalizeBookmarkUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    parsed.hash = "";
    const href = parsed.toString();
    return href.endsWith("/") && parsed.pathname === "/"
      ? href.slice(0, -1)
      : href;
  } catch {
    return "";
  }
}

export function extractDomainFromUrl(rawUrl: string): string | undefined {
  try {
    const host = new URL(rawUrl.trim()).hostname.replace(/^www\./i, "");
    return host || undefined;
  } catch {
    return undefined;
  }
}

export function getWebsiteCoverUrl(rawUrl: string, explicitCover?: string): string {
  if (explicitCover && explicitCover.trim()) {
    return explicitCover.trim();
  }
  const normalized = normalizeBookmarkUrl(rawUrl);
  if (!normalized) return "";
  return `https://image.thum.io/get/width/600/crop/800/noanimate/${normalized}`;
}

export function getWebsiteFaviconUrl(rawUrl: string, explicitFavicon?: string): string {
  if (explicitFavicon && explicitFavicon.trim()) {
    return explicitFavicon.trim();
  }
  const domain = extractDomainFromUrl(rawUrl);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function parseWebBookmarkItem(raw: unknown): WebBookmarkItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.url !== "string" || !rec.url.trim()) return null;
  const normalizedUrl = normalizeBookmarkUrl(rec.url);
  if (!normalizedUrl) return null;

  const domain =
    typeof rec.domain === "string" && rec.domain.trim()
      ? rec.domain.trim()
      : extractDomainFromUrl(normalizedUrl);
  const title =
    typeof rec.title === "string" && rec.title.trim()
      ? rec.title.trim()
      : (domain ?? normalizedUrl);
  const addedAt =
    typeof rec.addedAt === "number" && !Number.isNaN(rec.addedAt)
      ? rec.addedAt
      : Date.now();
  const id =
    typeof rec.id === "string" && rec.id.trim()
      ? rec.id.trim()
      : `link_${addedAt}_${Math.random().toString(36).slice(2, 8)}`;
  const folder =
    typeof rec.folder === "string" && rec.folder.trim()
      ? rec.folder.trim()
      : undefined;
  const description =
    typeof rec.description === "string" && rec.description.trim()
      ? rec.description.trim()
      : undefined;
  const favicon =
    typeof rec.favicon === "string" && rec.favicon.trim()
      ? rec.favicon.trim()
      : undefined;
  const cover =
    typeof rec.cover === "string" && rec.cover.trim()
      ? rec.cover.trim()
      : undefined;
  const note =
    typeof rec.note === "string" && rec.note.trim()
      ? rec.note.trim()
      : undefined;
  const trashed = typeof rec.trashed === "boolean" ? rec.trashed : undefined;
  const tags = Array.isArray(rec.tags)
    ? rec.tags
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
    : undefined;

  return {
    id,
    url: rec.url.trim(),
    title,
    addedAt,
    ...(domain ? { domain } : {}),
    ...(description ? { description } : {}),
    ...(folder ? { folder } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(favicon ? { favicon } : {}),
    ...(cover ? { cover } : {}),
    ...(note ? { note } : {}),
    ...(trashed !== undefined ? { trashed } : {}),
  };
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

    const rawLinks = Array.isArray(rawObj.links) ? rawObj.links : [];
    const links: WebBookmarkItem[] = [];
    for (const rawLink of rawLinks) {
      const link = parseWebBookmarkItem(rawLink);
      if (link) links.push(link);
    }

    return {
      version: 1,
      bookmarks,
      ...(links.length > 0 ? { links } : {}),
    };
  } catch {
    return createEmptyBookmarksData();
  }
}

export function serializeBookmarks(data: BookmarksData): string {
  const payload: BookmarksData = {
    version: 1,
    bookmarks: data.bookmarks,
    ...(data.links && data.links.length > 0 ? { links: data.links } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export { mergeBookmarkSets, mergeWebBookmarkSets } from "./bookmarkMerge";

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
  if (typeof writeNote !== "function") return;
  if (typeof withVaultWatchSuppressed === "function") {
    await withVaultWatchSuppressed(() => writeNote(BOOKMARKS_JSON_PATH, content));
  } else {
    await writeNote(BOOKMARKS_JSON_PATH, content);
  }
}
