import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBookmarkStore } from "./bookmarkStore";
import * as bookmarkStorage from "./bookmarkStorage";

vi.mock("./bookmarkStorage", async () => {
  const actual =
    await vi.importActual<typeof bookmarkStorage>("./bookmarkStorage");
  return {
    ...actual,
    loadBookmarksFile: vi.fn(),
    saveBookmarksFile: vi.fn(),
  };
});

describe("bookmarkStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
  });

  it("loads bookmarks and updates isLoaded", async () => {
    vi.mocked(bookmarkStorage.loadBookmarksFile).mockResolvedValue({
      version: 1,
      bookmarks: [{ path: "note-a.md", addedAt: 12345 }],
    });

    await useBookmarkStore.getState().loadBookmarks();

    expect(useBookmarkStore.getState().isLoaded).toBe(true);
    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "note-a.md", addedAt: 12345 },
    ]);
  });

  it("toggles bookmark on and off", async () => {
    const store = useBookmarkStore.getState();
    await store.addBookmark("note-1.md");
    expect(
      useBookmarkStore.getState().bookmarks.some((b) => b.path === "note-1.md"),
    ).toBe(true);

    await store.toggleBookmark("note-1.md");
    expect(
      useBookmarkStore.getState().bookmarks.some((b) => b.path === "note-1.md"),
    ).toBe(false);

    await store.toggleBookmark("note-1.md");
    expect(
      useBookmarkStore.getState().bookmarks.some((b) => b.path === "note-1.md"),
    ).toBe(true);
  });

  it("remaps path on file rename", () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "old/path.md", addedAt: 1000 }],
    });

    useBookmarkStore.getState().remapPath("old/path.md", "new/path.md");
    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "new/path.md", addedAt: 1000, missing: undefined },
    ]);
  });

  it("remaps folder on folder rename", () => {
    useBookmarkStore.setState({
      bookmarks: [
        { path: "docs/guide.md", addedAt: 100 },
        { path: "docs/nested/tutorial.md", addedAt: 200 },
        { path: "other/file.md", addedAt: 300 },
      ],
    });

    useBookmarkStore.getState().remapFolder("docs", "documentation");

    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "documentation/guide.md", addedAt: 100, missing: undefined },
      {
        path: "documentation/nested/tutorial.md",
        addedAt: 200,
        missing: undefined,
      },
      { path: "other/file.md", addedAt: 300 },
    ]);
  });

  it("marks missing and clears missing", () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "deleted.md", addedAt: 500 }],
    });

    useBookmarkStore.getState().markMissing("deleted.md");
    expect(useBookmarkStore.getState().bookmarks[0].missing).toBe(true);

    useBookmarkStore.getState().clearMissing("deleted.md");
    expect(useBookmarkStore.getState().bookmarks[0].missing).toBeUndefined();
  });

  it("adds, updates, imports, organizes, and undoes web bookmarks", () => {
    const store = useBookmarkStore.getState();
    const added = store.addWebBookmark({
      url: "https://tauri.app",
      title: "Tauri",
      tags: ["#Desktop", "Rust"],
    });
    expect(added).not.toBeNull();
    expect(useBookmarkStore.getState().webBookmarks).toHaveLength(1);
    expect(useBookmarkStore.getState().webBookmarks[0].tags).toEqual([
      "desktop",
      "rust",
    ]);

    const itemId = useBookmarkStore.getState().webBookmarks[0].id;
    store.updateWebBookmark(itemId, { folder: "Frameworks", title: "Tauri v2" });
    expect(useBookmarkStore.getState().webBookmarks[0].folder).toBe(
      "Frameworks",
    );
    expect(useBookmarkStore.getState().webBookmarks[0].title).toBe("Tauri v2");

    // Organize & Undo
    store.applyWebBookmarksOrganization([
      { id: itemId, folder: "Development", tags: ["tauri", "native"] },
    ]);
    expect(useBookmarkStore.getState().webBookmarks[0].folder).toBe(
      "Development",
    );
    expect(useBookmarkStore.getState().previousWebBookmarks).toHaveLength(1);

    store.undoLastOrganization();
    expect(useBookmarkStore.getState().webBookmarks[0].folder).toBe(
      "Frameworks",
    );
    expect(useBookmarkStore.getState().previousWebBookmarks).toBeNull();
  });
});
