import { invoke } from "@tauri-apps/api/core";
import type { WebBookmarkItem } from "./bookmarkTypes";
import { extractDomainFromUrl, normalizeBookmarkUrl } from "./bookmarkStorage";

export interface BrowserImportSummary {
  items: WebBookmarkItem[];
  folders: string[];
  detectedFormat: "netscape-html" | "browser-json" | "unknown";
}

export type SupportedBrowserId =
  | "chrome"
  | "brave"
  | "firefox"
  | "arc"
  | "edge"
  | "vivaldi";

export interface DetectedBrowserInfo {
  id: SupportedBrowserId;
  name: string;
  available: boolean;
  profileCount: number;
}

export const DEFAULT_BROWSERS: readonly DetectedBrowserInfo[] = [
  { id: "chrome", name: "Google Chrome", available: true, profileCount: 1 },
  { id: "brave", name: "Brave", available: true, profileCount: 1 },
  { id: "firefox", name: "Firefox", available: true, profileCount: 1 },
  { id: "arc", name: "Arc", available: false, profileCount: 0 },
  { id: "edge", name: "Microsoft Edge", available: false, profileCount: 0 },
  { id: "vivaldi", name: "Vivaldi", available: false, profileCount: 0 },
];

const GENERIC_ROOT_FOLDERS = new Set([
  "bookmarks", "bookmarks bar", "bookmarks toolbar", "bookmarks menu",
  "other bookmarks", "mobile bookmarks", "synced bookmarks", "favorites",
  "favorites bar", "other favorites", "unfiled bookmarks", "menu", "toolbar",
]);

function normalizeTimestamp(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return Date.now();
  const num = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (Number.isNaN(num) || num <= 0) return Date.now();
  if (num > 1e15) {
    const unixMs = Math.floor(num / 1000 - 11644473600000);
    return unixMs > 0 ? unixMs : Date.now();
  }
  return num < 1e11 ? Math.floor(num * 1000) : Math.floor(num);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/<[^>]+>/g, "")
    .trim();
}

function readAttr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

function cleanFolderPath(segments: readonly string[]): string | undefined {
  const filtered = segments.map((s) => s.trim()).filter((s) => s.length > 0 && !GENERIC_ROOT_FOLDERS.has(s.toLowerCase()));
  return filtered.length > 0 ? filtered.join(" / ") : undefined;
}

function parseNetscapeHtmlBookmarks(html: string): WebBookmarkItem[] {
  const results = new Map<string, WebBookmarkItem>();
  const dlStack: string[] = [];
  let pendingFolder: string | null = null;
  let counter = 0;

  const tokenRegex =
    /<h3\b[^>]*>([\s\S]*?)<\/h3>|<dl\b[^>]*>|<\/dl>|<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(tokenRegex)) {
    const full = match[0].toLowerCase();
    if (full.startsWith("<h3")) {
      pendingFolder = decodeHtmlEntities(match[1] ?? "");
    } else if (full.startsWith("<dl")) {
      dlStack.push(pendingFolder ?? "");
      pendingFolder = null;
    } else if (full.startsWith("</dl")) {
      dlStack.pop();
      pendingFolder = null;
    } else if (full.startsWith("<a")) {
      const attrs = match[2] ?? "";
      const rawTitle = decodeHtmlEntities(match[3] ?? "");
      const href = readAttr(attrs, "href") ?? "";
      const normalizedUrl = normalizeBookmarkUrl(href);
      if (!normalizedUrl) continue;

      const domain = extractDomainFromUrl(normalizedUrl);
      const title = rawTitle || domain || normalizedUrl;
      const addDate = readAttr(attrs, "add_date");
      const rawTags = readAttr(attrs, "tags") ?? "";
      const tags = rawTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean);
      const folder = cleanFolderPath(dlStack);
      const addedAt = normalizeTimestamp(addDate);
      counter += 1;

      results.set(normalizedUrl, {
        id: `import_${addedAt}_${counter}`,
        url: href.trim(),
        title,
        addedAt,
        ...(domain ? { domain } : {}),
        ...(folder ? { folder } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      });
    }
  }
  return Array.from(results.values());
}

function parseBrowserJsonBookmarks(rawJson: string): WebBookmarkItem[] {
  const parsed = JSON.parse(rawJson) as unknown;
  const results = new Map<string, WebBookmarkItem>();
  let counter = 0;

  function visitNode(node: unknown, folderStack: string[]): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) visitNode(child, folderStack);
      return;
    }
    const rec = node as Record<string, unknown>;
    const rawUrl =
      typeof rec.url === "string"
        ? rec.url
        : typeof rec.uri === "string"
          ? rec.uri
          : "";

    if (rawUrl) {
      const normalizedUrl = normalizeBookmarkUrl(rawUrl);
      if (normalizedUrl) {
        const domain = extractDomainFromUrl(normalizedUrl);
        const title =
          (typeof rec.name === "string" && rec.name.trim()) ||
          (typeof rec.title === "string" && rec.title.trim()) ||
          domain ||
          normalizedUrl;
        const folder =
          typeof rec.folder === "string" && rec.folder.trim()
            ? cleanFolderPath([rec.folder.trim()])
            : cleanFolderPath(folderStack);
        const addedAt = normalizeTimestamp(
          (rec.date_added ?? rec.dateAdded ?? rec.addedAt) as
            | string
            | number
            | undefined,
        );
        const tags = Array.isArray(rec.tags)
          ? rec.tags
              .filter((t): t is string => typeof t === "string")
              .map((t) => t.trim().replace(/^#/, "").toLowerCase())
              .filter(Boolean)
          : [];
        counter += 1;
        results.set(normalizedUrl, {
          id: `import_json_${addedAt}_${counter}`,
          url: rawUrl.trim(),
          title,
          addedAt,
          ...(domain ? { domain } : {}),
          ...(folder ? { folder } : {}),
          ...(tags.length > 0 ? { tags } : {}),
        });
      }
    }

    const folderName =
      typeof rec.name === "string"
        ? rec.name
        : typeof rec.title === "string"
          ? rec.title
          : "";
    const nextStack = folderName ? [...folderStack, folderName] : folderStack;

    if (Array.isArray(rec.children)) {
      for (const child of rec.children) visitNode(child, nextStack);
    }
    if (rec.roots && typeof rec.roots === "object") {
      for (const rootVal of Object.values(rec.roots as Record<string, unknown>)) {
        visitNode(rootVal, folderStack);
      }
    }
    if (Array.isArray(rec.links)) {
      for (const child of rec.links) visitNode(child, folderStack);
    }
  }

  visitNode(parsed, []);
  return Array.from(results.values());
}

export function parseImportedBookmarksFile(content: string): BrowserImportSummary {
  const trimmed = content.trim();
  if (!trimmed) return { items: [], folders: [], detectedFormat: "unknown" };

  let items: WebBookmarkItem[] = [];
  let detectedFormat: BrowserImportSummary["detectedFormat"] = "unknown";

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      items = parseBrowserJsonBookmarks(trimmed);
      detectedFormat = "browser-json";
    } catch {
      items = [];
    }
  } else if (/<a\s/i.test(trimmed) || /NETSCAPE-Bookmark/i.test(trimmed)) {
    items = parseNetscapeHtmlBookmarks(trimmed);
    detectedFormat = "netscape-html";
  }

  const folders = Array.from(
    new Set(items.map((item) => item.folder).filter((f): f is string => Boolean(f))),
  ).sort((a, b) => a.localeCompare(b));

  return { items, folders, detectedFormat };
}

export async function detectInstalledBrowsers(): Promise<DetectedBrowserInfo[]> {
  try {
    const list = await invoke<DetectedBrowserInfo[]>("detect_browser_bookmarks");
    return Array.isArray(list) && list.length > 0 ? list : [...DEFAULT_BROWSERS];
  } catch {
    return [...DEFAULT_BROWSERS];
  }
}

export async function autoImportFromBrowser(
  browserId: string,
): Promise<BrowserImportSummary> {
  const raw = await invoke<unknown>("read_browser_bookmarks", { browserId });
  const content = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
  return parseImportedBookmarksFile(content);
}
