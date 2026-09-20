import { describe, expect, it } from "vitest";
import { isEmojiIcon } from "./isEmojiIcon";
import { updateNoteIconContent } from "./updateNoteIconContent";

describe("emoji icon validation", () => {
  it.each(["🚀", "👍🏽", "👩‍💻", "👨‍👩‍👧", "🇹🇳", "1️⃣"])("accepts %s", (icon) => {
    expect(isEmojiIcon(icon)).toBe(true);
  });

  it.each(["", "abc", "<img>", "🚀✨", "a🚀"])("rejects %s", (icon) => {
    expect(isEmojiIcon(icon)).toBe(false);
  });
});

describe("updateNoteIconContent", () => {
  it("creates minimal frontmatter", () => {
    expect(updateNoteIconContent("# Note\n", "🚀")).toBe(
      '---\nicon: "🚀"\n---\n# Note\n',
    );
  });

  it("preserves unrelated YAML comments and values", () => {
    const source = "---\n# keep\ntitle: 'Quoted'\ntags: [work]\n---\n# Note\n";
    expect(updateNoteIconContent(source, "👩‍💻")).toBe(
      "---\nicon: \"👩‍💻\"\n# keep\ntitle: 'Quoted'\ntags: [work]\n---\n# Note\n",
    );
  });

  it("replaces and removes only icon", () => {
    const source = "---\ntitle: N\nicon: 🚀\n# keep\n---\nBody";
    expect(updateNoteIconContent(source, "🇹🇳")).toContain('icon: "🇹🇳"');
    expect(updateNoteIconContent(source, null)).toBe(
      "---\ntitle: N\n# keep\n---\nBody",
    );
  });
});
