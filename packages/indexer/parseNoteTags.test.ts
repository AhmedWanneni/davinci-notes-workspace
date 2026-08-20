import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./parseFrontmatter";
import { parseNoteTags } from "./parseNoteTags";

describe("parseNoteTags", () => {
  it("merges frontmatter and inline tags into a canonical note tag set", () => {
    const raw = [
      "---",
      "tags:",
      "  - Recipe",
      "  - cooking",
      "---",
      "",
      "Plan #TAG and #cooking, then #recipe again.",
    ].join("\n");

    const { frontmatter, content } = parseFrontmatter(raw);
    const tags = parseNoteTags(frontmatter, content);

    expect(tags.frontmatter.map((tag) => tag.display)).toEqual([
      "#Recipe",
      "#cooking",
    ]);
    expect(tags.inline.map((tag) => tag.display)).toEqual([
      "#TAG",
      "#cooking",
      "#Recipe",
    ]);
    expect(tags.all.map((tag) => tag.display)).toEqual([
      "#Recipe",
      "#cooking",
      "#TAG",
    ]);
  });

  it("handles notes with only frontmatter, only inline tags, both, or neither", () => {
    const frontmatterOnly = parseNoteTags(
      { tags: ["alpha", "beta"] },
      "",
    );
    expect(frontmatterOnly.all.map((tag) => tag.display)).toEqual([
      "#alpha",
      "#beta",
    ]);

    const inlineOnly = parseNoteTags({}, "Body with #Gamma and #delta.");
    expect(inlineOnly.all.map((tag) => tag.display)).toEqual([
      "#Gamma",
      "#delta",
    ]);

    const neither = parseNoteTags({}, "");
    expect(neither).toEqual({
      frontmatter: [],
      inline: [],
      all: [],
    });
  });
});
