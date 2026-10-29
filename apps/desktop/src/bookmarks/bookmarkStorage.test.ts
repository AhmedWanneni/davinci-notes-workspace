import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseBookmarks,
  serializeBookmarks,
  mergeBookmarkSets,
  createEmptyBookmarksData,
  loadBookmarksFile,
  saveBookmarksFile,
} from "./bookmarkStorage";
import { BOOKMARKS_JSON_PATH, type BookmarkItem } from "./bookmarkTypes";

const mockReadNote = vi.fn();
const mockWriteNote = vi.fn();
const mockWithVaultWatchSuppressed = vi.fn((fn: () => unknown) => fn());

vi.mock("../vault", () => ({
  readNote: (path: string) => mockReadNote(path),
  writeNote: (path: string, content: string) => mockWriteNote(path, content),
  withVaultWatchSuppressed: (fn: () => unknown) =>
    mockWithVaultWatchSuppressed(fn),
}));

describe("bookmarkStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseBookmarks (corrupted and empty file handling)", () => {
    it("returns empty bookmarks on empty string or whitespace", () => {
      expect(parseBookmarks("")).toEqual(createEmptyBookmarksData());
      expect(parseBookmarks("   \n\t  ")).toEqual(createEmptyBookmarksData());
    });

    it("returns empty bookmarks on syntax-corrupted JSON", () => {
      expect(parseBookmarks("{ corrupted json ...")).toEqual(
        createEmptyBookmarksData(),
      );
      expect(parseBookmarks("not json at all")).toEqual(
        createEmptyBookmarksData(),
      );
    });

    it("returns empty bookmarks when root is not an object", () => {
      expect(parseBookmarks("[]")).toEqual(createEmptyBookmarksData());
      expect(parseBookmarks('"string"')).toEqual(createEmptyBookmarksData());
      expect(parseBookmarks("42")).toEqual(createEmptyBookmarksData());
      expect(parseBookmarks("null")).toEqual(createEmptyBookmarksData());
    });

    it("filters out invalid items without valid paths", () => {
      const input = JSON.stringify({
        version: 1,
        bookmarks: [
          { path: "", addedAt: 100 },
          { path: "   ", addedAt: 200 },
          { path: 123, addedAt: 300 },
          null,
          "just a string",
          { path: "valid/note.md", addedAt: 400 },
        ],
      });

      const parsed = parseBookmarks(input);
      expect(parsed.version).toBe(1);
      expect(parsed.bookmarks).toEqual([
        { path: "valid/note.md", addedAt: 400 },
      ]);
    });

    it("supplies current timestamp if addedAt is missing or invalid", () => {
      const before = Date.now();
      const input = JSON.stringify({
        version: 1,
        bookmarks: [{ path: "note.md", addedAt: "invalid" }],
      });
      const parsed = parseBookmarks(input);
      const after = Date.now();

      expect(parsed.bookmarks).toHaveLength(1);
      expect(parsed.bookmarks[0].path).toBe("note.md");
      expect(parsed.bookmarks[0].addedAt).toBeGreaterThanOrEqual(before);
      expect(parsed.bookmarks[0].addedAt).toBeLessThanOrEqual(after);
    });

    it("parses missing: true correctly", () => {
      const input = JSON.stringify({
        version: 1,
        bookmarks: [
          { path: "missing.md", addedAt: 500, missing: true },
          { path: "present.md", addedAt: 600, missing: false },
        ],
      });
      const parsed = parseBookmarks(input);
      expect(parsed.bookmarks).toEqual([
        { path: "missing.md", addedAt: 500, missing: true },
        { path: "present.md", addedAt: 600 },
      ]);
    });
  });

  describe("serializeBookmarks", () => {
    it("round-trips cleanly with parseBookmarks", () => {
      const data = {
        version: 1 as const,
        bookmarks: [
          { path: "notes/a.md", addedAt: 1000 },
          { path: "notes/b.md", addedAt: 2000, missing: true },
        ],
      };
      const json = serializeBookmarks(data);
      expect(parseBookmarks(json)).toEqual(data);
    });
  });

  describe("mergeBookmarkSets (concurrent-edit merge)", () => {
    it("preserves disjoint bookmarks from both sets", () => {
      const local: BookmarkItem[] = [{ path: "a.md", addedAt: 1000 }];
      const remote: BookmarkItem[] = [{ path: "b.md", addedAt: 1500 }];

      const merged = mergeBookmarkSets(local, remote);
      expect(merged).toHaveLength(2);
      expect(merged).toEqual(
        expect.arrayContaining([
          { path: "a.md", addedAt: 1000 },
          { path: "b.md", addedAt: 1500 },
        ]),
      );
    });

    it("resolves conflicts by choosing highest addedAt timestamp", () => {
      const local: BookmarkItem[] = [
        { path: "shared.md", addedAt: 1000 },
        { path: "local-wins.md", addedAt: 5000 },
      ];
      const remote: BookmarkItem[] = [
        { path: "shared.md", addedAt: 2000 },
        { path: "local-wins.md", addedAt: 3000 },
      ];

      const merged = mergeBookmarkSets(local, remote);
      expect(merged).toHaveLength(2);

      const shared = merged.find((b) => b.path === "shared.md");
      const localWins = merged.find((b) => b.path === "local-wins.md");

      expect(shared?.addedAt).toBe(2000);
      expect(localWins?.addedAt).toBe(5000);
    });

    it("preserves missing state if marked missing in either version", () => {
      const local: BookmarkItem[] = [
        { path: "item.md", addedAt: 1000, missing: true },
      ];
      const remote: BookmarkItem[] = [{ path: "item.md", addedAt: 2000 }];

      const merged = mergeBookmarkSets(local, remote);
      expect(merged[0].missing).toBe(true);
    });
  });

  describe("loadBookmarksFile & saveBookmarksFile", () => {
    it("loads and parses bookmarks from disk", async () => {
      mockReadNote.mockResolvedValue({
        content: JSON.stringify({
          version: 1,
          bookmarks: [{ path: "doc.md", addedAt: 123 }],
        }),
      });

      const res = await loadBookmarksFile();
      expect(mockReadNote).toHaveBeenCalledWith(BOOKMARKS_JSON_PATH);
      expect(res.bookmarks).toEqual([{ path: "doc.md", addedAt: 123 }]);
    });

    it("returns empty data when disk read throws (e.g. file does not exist)", async () => {
      mockReadNote.mockRejectedValue(new Error("File not found"));
      const res = await loadBookmarksFile();
      expect(res).toEqual(createEmptyBookmarksData());
    });

    it("writes serialized bookmarks with watch suppressed", async () => {
      mockWriteNote.mockResolvedValue(undefined);
      const data = {
        version: 1 as const,
        bookmarks: [{ path: "note.md", addedAt: 456 }],
      };

      await saveBookmarksFile(data);
      expect(mockWithVaultWatchSuppressed).toHaveBeenCalled();
      expect(mockWriteNote).toHaveBeenCalledWith(
        BOOKMARKS_JSON_PATH,
        serializeBookmarks(data),
      );
    });
  });
});
