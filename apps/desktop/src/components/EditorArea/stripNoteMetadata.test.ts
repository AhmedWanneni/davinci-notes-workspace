import { describe, it, expect } from "vitest";
import { stripNoteMetadata } from "./stripNoteMetadata";

describe("stripNoteMetadata", () => {
  it("removes cover, cover_y, and icon from note frontmatter", () => {
    const raw =
      '---\ntitle: "Books"\ncover: "https://example.com/cover.jpg"\ncover_y: 40\nicon: "📚"\n---\n# Books\nContent';
    expect(stripNoteMetadata(raw)).toBe(
      '---\ntitle: "Books"\n---\n# Books\nContent',
    );
  });

  it("removes entire frontmatter when only cover and icon existed", () => {
    const raw =
      '---\ncover: "https://example.com/cover.jpg"\ncover_y: 40\nicon: "📚"\n---\n# Books\nContent';
    expect(stripNoteMetadata(raw)).toBe("# Books\nContent");
  });

  it("removes obsidian banner and banner_y keys", () => {
    const raw =
      '---\nbanner: "https://example.com/cover.jpg"\nbanner_y: 0.5\n---\nBody';
    expect(stripNoteMetadata(raw)).toBe("Body");
  });

  it("does nothing if raw has no frontmatter", () => {
    const raw = "# Just markdown content\nNothing else";
    expect(stripNoteMetadata(raw)).toBe(raw);
  });
});
