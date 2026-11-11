import type { WebBookmarkItem } from "./bookmarkTypes";
import {
  extractDomainFromUrl,
  getWebsiteCoverUrl,
  getWebsiteFaviconUrl,
} from "./bookmarkStorage";
import type {
  BrowserImportSummary,
  DetectedBrowserInfo,
} from "./browserBookmarkImporter";

export function getDevFallbackBookmarks(
  browserId: string,
  browsers: readonly DetectedBrowserInfo[],
): BrowserImportSummary {
  const name = browsers.find((b) => b.id === browserId)?.name ?? "Browser";
  const now = Date.now();
  const samples = [
    { url: "https://github.com", title: "GitHub: Let's build from here" },
    { url: "https://news.ycombinator.com", title: "Hacker News" },
    { url: "https://developer.mozilla.org", title: "MDN Web Docs" },
  ];
  const items: WebBookmarkItem[] = samples.map((s, idx) => ({
    id: `dev_${browserId}_${idx}`,
    url: s.url,
    title: s.title,
    domain: extractDomainFromUrl(s.url),
    folder: `${name} Bookmarks`,
    addedAt: now - idx * 86400000,
    cover: getWebsiteCoverUrl(s.url),
    favicon: getWebsiteFaviconUrl(s.url),
  }));
  return {
    items,
    folders: [`${name} Bookmarks`],
    detectedFormat: "browser-json",
  };
}
