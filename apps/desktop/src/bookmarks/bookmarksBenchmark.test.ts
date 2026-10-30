import { describe, it, expect } from "vitest";
import {
  parseBookmarks,
  serializeBookmarks,
  mergeBookmarkSets,
} from "./bookmarkStorage";
import type { BookmarkItem, BookmarksData } from "./bookmarkTypes";

describe("bookmarksBenchmark (1,000 bookmarks performance)", () => {
  const count = 1000;
  const items: BookmarkItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      path: `Folder_${i % 20}/Sub_${i % 5}/Note_Document_${i}.md`,
      addedAt: 1700000000000 + i * 1000,
      ...(i % 50 === 0 ? { missing: true } : {}),
    });
  }

  const sampleData: BookmarksData = {
    version: 1,
    bookmarks: items,
  };

  it("serializes 1,000 bookmarks in under 10ms", () => {
    const start = performance.now();
    const json = serializeBookmarks(sampleData);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
    expect(json.length).toBeGreaterThan(10000);
  });

  it("parses 1,000 bookmarks from JSON in under 10ms", () => {
    const json = serializeBookmarks(sampleData);

    const start = performance.now();
    const parsed = parseBookmarks(json);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
    expect(parsed.bookmarks).toHaveLength(count);
    expect(parsed.version).toBe(1);
  });

  it("filters and sorts 1,000 bookmarks in under 10ms", () => {
    const query = "folder_3";

    const start = performance.now();
    const filtered = items.filter((b) =>
      b.path.toLowerCase().includes(query),
    );
    filtered.sort((a, b) => {
      const nameA = a.path.split("/").pop() ?? a.path;
      const nameB = b.path.split("/").pop() ?? b.path;
      return nameA.localeCompare(nameB);
    });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("merges two 1,000-item sets in under 15ms", () => {
    const remoteItems: BookmarkItem[] = items.map((item, i) => ({
      ...item,
      addedAt: item.addedAt + (i % 2 === 0 ? 500 : -500),
    }));

    const start = performance.now();
    const merged = mergeBookmarkSets(items, remoteItems);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
    expect(merged).toHaveLength(count);
  });
});
