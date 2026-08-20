import { describe, expect, it } from "vitest";
import { noteFromMarkdown } from "./noteFromMarkdown";

describe("noteFromMarkdown", () => {
  it("merges frontmatter tags and inline tags into the note tag set", () => {
    const raw = [
      "---",
      "title: Tagged Note",
      "tags:",
      "  - Recipe",
      "  - cooking",
      "---",
      "",
      "Body with #TAG and #cooking, then #recipe again.",
    ].join("\n");

    const note = noteFromMarkdown("notes/tagged.md", raw, 123, [
      "notes/tagged.md",
    ]);

    expect(note.title).toBe("Tagged Note");
    expect(note.tags.frontmatter.map((tag) => tag.display)).toEqual([
      "#Recipe",
      "#cooking",
    ]);
    expect(note.tags.inline.map((tag) => tag.display)).toEqual([
      "#TAG",
      "#cooking",
      "#Recipe",
    ]);
    expect(note.tags.all.map((tag) => tag.display)).toEqual([
      "#Recipe",
      "#cooking",
      "#TAG",
    ]);
  });

  it("returns an empty merged tag set when no tags are present", () => {
    const note = noteFromMarkdown("notes/plain.md", "# Plain note", 123, [
      "notes/plain.md",
    ]);

    expect(note.tags).toEqual({
      frontmatter: [],
      inline: [],
      all: [],
    });
  });
});
