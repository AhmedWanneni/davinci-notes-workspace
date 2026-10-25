// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookmarks } from "./useBookmarks";
import { useBookmarkStore } from "./bookmarkStore";

describe("useBookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
  });

  it("checks if note is bookmarked correctly", () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "docs/spec.md", addedAt: 1234 }],
      isLoaded: true,
    });

    const { result } = renderHook(() => useBookmarks());
    expect(result.current.isBookmarked("docs/spec.md")).toBe(true);
    expect(result.current.isBookmarked("docs/other.md")).toBe(false);
    expect(result.current.isBookmarked(null)).toBe(false);
    expect(result.current.isBookmarked(undefined)).toBe(false);
  });

  it("toggles bookmark on and off via hook", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      isLoaded: true,
    });

    const { result } = renderHook(() => useBookmarks());
    expect(result.current.isBookmarked("notes/todo.md")).toBe(false);

    await act(async () => {
      await result.current.toggleBookmark("notes/todo.md");
    });
    expect(result.current.isBookmarked("notes/todo.md")).toBe(true);

    await act(async () => {
      await result.current.toggleBookmark("notes/todo.md");
    });
    expect(result.current.isBookmarked("notes/todo.md")).toBe(false);
  });

  it("adds and removes bookmarks directly", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      isLoaded: true,
    });

    const { result } = renderHook(() => useBookmarks());
    await act(async () => {
      await result.current.addBookmark("note-a.md");
    });
    expect(result.current.isBookmarked("note-a.md")).toBe(true);

    await act(async () => {
      await result.current.removeBookmark("note-a.md");
    });
    expect(result.current.isBookmarked("note-a.md")).toBe(false);
  });
});
