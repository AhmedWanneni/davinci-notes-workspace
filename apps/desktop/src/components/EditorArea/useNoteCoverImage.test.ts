// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNoteCoverImage } from "./useNoteCoverImage";

const loadNoteCovers = vi.fn();
const persistNoteCover = vi.fn();

vi.mock("./noteCoverStorage", () => ({
  loadNoteCovers: () => loadNoteCovers(),
  persistNoteCover: (...args: unknown[]) => persistNoteCover(...args),
}));

describe("useNoteCoverImage", () => {
  beforeEach(() => {
    loadNoteCovers.mockReset().mockResolvedValue({});
    persistNoteCover.mockReset().mockResolvedValue({});
  });

  it("extracts legacy coverUrl and coverY when storage is empty", () => {
    const { result } = renderHook(() =>
      useNoteCoverImage(
        "note.md",
        "content",
        { cover: "https://example.com/cover.png", cover_y: 45 },
        vi.fn(),
      ),
    );

    expect(result.current.coverUrl).toBe("https://example.com/cover.png");
    expect(result.current.coverY).toBe(45);
  });

  it("sets cover without adding anything to note markdown content", () => {
    const updateContent = vi.fn();
    const { result } = renderHook(() =>
      useNoteCoverImage("note.md", "# Hello", {}, updateContent),
    );

    act(() => {
      result.current.handleSetCover("https://example.com/new.png", 60);
    });

    // Does not write frontmatter to content
    expect(updateContent).not.toHaveBeenCalled();
    expect(persistNoteCover).toHaveBeenCalledWith(
      "note.md",
      { url: "https://example.com/new.png", y: 60 },
      expect.any(Object),
    );
  });

  it("strips legacy cover and icon from content if present in note", () => {
    const updateContent = vi.fn();
    const dirtyContent = '---\ncover: "old.jpg"\nicon: "🚀"\n---\n# Clean Text';

    renderHook(() =>
      useNoteCoverImage("note.md", dirtyContent, {}, updateContent),
    );

    expect(updateContent).toHaveBeenCalledWith("note.md", "# Clean Text");
  });
});
