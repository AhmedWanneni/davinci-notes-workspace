import { invoke } from "@tauri-apps/api/core";
import type { WebBookmarkItem } from "./bookmarkTypes";
import {
  parseBrowserJsonBookmarks,
  parseNetscapeHtmlBookmarks,
} from "./browserBookmarkParsers";
import { getDevFallbackBookmarks } from "./browserBookmarkFallback";

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
  try {
    const raw = await invoke<unknown>("read_browser_bookmarks", {
      browserId,
      browser_id: browserId,
    });
    const content = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
    const parsed = parseImportedBookmarksFile(content);
    return parsed.items.length > 0
      ? parsed
      : getDevFallbackBookmarks(browserId, DEFAULT_BROWSERS);
  } catch {
    return getDevFallbackBookmarks(browserId, DEFAULT_BROWSERS);
  }
}
