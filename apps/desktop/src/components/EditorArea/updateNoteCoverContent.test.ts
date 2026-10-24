import { describe, it, expect } from "vitest";
import { updateNoteCoverContent } from "./updateNoteCoverContent";

describe("updateNoteCoverContent", () => {
  it("prepends frontmatter when none exists", () => {
    const raw = "# Hello World\nSome text";
    const res = updateNoteCoverContent(raw, "https://example.com/cover.jpg");
    expect(res).toBe(
      '---\ncover: "https://example.com/cover.jpg"\n---\n# Hello World\nSome text',
    );
  });

  it("prepends frontmatter with cover_y when specified", () => {
    const raw = "# Hello World";
    const res = updateNoteCoverContent(raw, "https://example.com/cover.jpg", 35);
    expect(res).toBe(
      '---\ncover: "https://example.com/cover.jpg"\ncover_y: 35\n---\n# Hello World',
    );
  });

  it("updates existing cover property in frontmatter without clobbering other properties", () => {
    const raw = '---\ntitle: "My Note"\ncover: "old.png"\ntags: [a, b]\n---\nBody text';
    const res = updateNoteCoverContent(raw, "new.png", 60);
    expect(res).toContain('cover: "new.png"');
    expect(res).toContain("cover_y: 60");
    expect(res).toContain('title: "My Note"');
    expect(res).toContain("tags: [a, b]");
    expect(res).toContain("Body text");
  });

  it("preserves 'banner' key if note already used banner", () => {
    const raw = '---\nbanner: "old.png"\nbanner_y: 0.2\n---\nBody';
    const res = updateNoteCoverContent(raw, "new.png", 40);
    expect(res).toContain('banner: "new.png"');
    expect(res).toContain("banner_y: 40");
    expect(res).not.toContain("cover:");
  });

  it("removes cover and cover_y when cover is null", () => {
    const raw = '---\ntitle: "Keep Me"\ncover: "remove.png"\ncover_y: 50\n---\nBody';
    const res = updateNoteCoverContent(raw, null);
    expect(res).not.toContain("cover:");
    expect(res).not.toContain("cover_y:");
    expect(res).toContain('title: "Keep Me"');
    expect(res).toContain("Body");
  });

  it("removes entire frontmatter if cover was the only property", () => {
    const raw = '---\ncover: "remove.png"\n---\nBody content';
    const res = updateNoteCoverContent(raw, null);
    expect(res).toBe("Body content");
  });

  it("does nothing when removing cover from note without frontmatter", () => {
    const raw = "Simple note with no frontmatter";
    expect(updateNoteCoverContent(raw, null)).toBe(raw);
  });
});
