import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBookmarkStore } from "./bookmarkStore";

describe("bookmark lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
  });

  it("remaps nested bookmark paths when a folder is renamed", () => {
    useBookmarkStore.setState({
      bookmarks: [
        { path: "projects/alpha/spec.md", addedAt: 100 },
        { path: "projects/alpha/design.md", addedAt: 200 },
        { path: "projects/beta/readme.md", addedAt: 300 },
        { path: "standalone.md", addedAt: 400 },
      ],
    });

    // Rename "projects/alpha" to "projects/v2"
    useBookmarkStore.getState().remapFolder("projects/alpha", "projects/v2");

    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "projects/v2/spec.md", addedAt: 100, missing: undefined },
      { path: "projects/v2/design.md", addedAt: 200, missing: undefined },
      { path: "projects/beta/readme.md", addedAt: 300 },
      { path: "standalone.md", addedAt: 400 },
    ]);
  });

  it("remaps note path and preserves addedAt on file rename", () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "Notes/Draft.md", addedAt: 5555 }],
    });

    useBookmarkStore.getState().remapPath("Notes/Draft.md", "Notes/Published.md");

    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "Notes/Published.md", addedAt: 5555, missing: undefined },
    ]);
  });

  it("marks note as missing when deleted, and clears missing on restore", () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "notes/daily.md", addedAt: 1234 }],
    });

    // Delete note
    useBookmarkStore.getState().markMissing("notes/daily.md");
    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "notes/daily.md", addedAt: 1234, missing: true },
    ]);

    // Restore note
    useBookmarkStore.getState().clearMissing("notes/daily.md");
    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "notes/daily.md", addedAt: 1234, missing: undefined },
    ]);
  });

  it("marks all folder descendant bookmarks as missing on folder delete", () => {
    useBookmarkStore.setState({
      bookmarks: [
        { path: "archive/old1.md", addedAt: 10 },
        { path: "archive/sub/old2.md", addedAt: 20 },
        { path: "active/current.md", addedAt: 30 },
      ],
    });

    useBookmarkStore.getState().markFolderMissing("archive");

    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "archive/old1.md", addedAt: 10, missing: true },
      { path: "archive/sub/old2.md", addedAt: 20, missing: true },
      { path: "active/current.md", addedAt: 30 },
    ]);
  });

  it("merges external watcher updates without loop or data loss", () => {
    useBookmarkStore.setState({
      bookmarks: [
        { path: "local-note.md", addedAt: 100 },
        { path: "shared.md", addedAt: 200 },
      ],
    });

    const incomingFromDisk = [
      { path: "shared.md", addedAt: 300 },
      { path: "device-b-note.md", addedAt: 250 },
    ];

    useBookmarkStore.getState().mergeExternalBookmarks(incomingFromDisk);

    const result = useBookmarkStore.getState().bookmarks;
    expect(result).toHaveLength(3);
    expect(result.find((b) => b.path === "shared.md")?.addedAt).toBe(300);
    expect(result.some((b) => b.path === "local-note.md")).toBe(true);
    expect(result.some((b) => b.path === "device-b-note.md")).toBe(true);
  });
});
