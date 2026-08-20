import { describe, expect, it } from "vitest";
import {
  collectNoteTags,
  decomposeTag,
  isValidTag,
  isValidTagBody,
  matchTags,
  normalizeTag,
  normalizeTagBody,
  emptyNoteTagSet,
  TagRegistry,
} from "./index";

describe("tag matching rules", () => {
  it("accepts the specified valid forms", () => {
    expect(isValidTag("#meeting")).toBe(true);
    expect(isValidTag("#y1984")).toBe(true);
    expect(isValidTag("#inbox/to-read")).toBe(true);
    expect(isValidTag("#café")).toBe(true);
    expect(isValidTag("#🚀")).toBe(true);
  });

  it("rejects all-numeric, empty, and malformed nested tags", () => {
    expect(isValidTag("#1984")).toBe(false);
    expect(isValidTag("#")).toBe(false);
    expect(isValidTag("#inbox/with space")).toBe(false);
    expect(isValidTag("#inbox/")).toBe(false);
    expect(isValidTag("#/child")).toBe(false);
  });

  it("ends a match at whitespace and punctuation", () => {
    expect(matchTags("Read #meeting, then #inbox/to-read today.")).toEqual([
      { raw: "#meeting", tag: "#meeting", start: 5, end: 13 },
      { raw: "#inbox/to-read", tag: "#inbox/to-read", start: 20, end: 34 },
    ]);
    expect(matchTags("#1984 #y1984 #tag with spaces").map((match) => match.tag)).toEqual([
      "#y1984",
      "#tag",
    ]);
  });
});

describe("nested tags", () => {
  it("decomposes a tag into inclusive ancestors", () => {
    expect(decomposeTag("#a/b/c")).toEqual(["#a", "#a/b", "#a/b/c"]);
  });
});

describe("body-only tag rules", () => {
  it("accepts valid frontmatter tag bodies and rejects invalid ones", () => {
    expect(isValidTagBody("meeting")).toBe(true);
    expect(isValidTagBody("inbox/to-read")).toBe(true);
    expect(isValidTagBody("1984")).toBe(false);
    expect(isValidTagBody("")).toBe(false);
    expect(isValidTagBody("with space")).toBe(false);
    expect(isValidTagBody("#tag")).toBe(false);
  });

  it("normalizes a tag body identity without adding a hash", () => {
    expect(normalizeTagBody("InBox/To-Read")).toBe("inbox/to-read");
  });
});

describe("canonical tag registry", () => {
  it("keeps first-seen display casing for case-insensitive identity", () => {
    const registry = new TagRegistry();
    const first = registry.register("#Tag");
    const second = registry.register("#TAG");

    expect(normalizeTag("#tag")).toBe("tag");
    expect(first).toBe(second);
    expect(second.display).toBe("#Tag");
    expect(registry.get("#tAg")?.display).toBe("#Tag");
  });

  it("registers canonical ancestors for nested tags", () => {
    const registry = new TagRegistry();
    expect(registry.ancestors("#Inbox/To-Read").map((tag) => tag.display)).toEqual([
      "#Inbox",
      "#Inbox/To-Read",
    ]);
  });

  it("registers frontmatter body tags with the same canonical registry", () => {
    const registry = new TagRegistry();
    const first = registry.registerBody("Recipe");
    const second = registry.register("#RECIPE");

    expect(first).toBe(second);
    expect(first.display).toBe("#Recipe");
    expect(registry.getBody("recipe")?.display).toBe("#Recipe");
  });
});

describe("merged note tag sets", () => {
  it("merges frontmatter and inline tags with canonical deduplication", () => {
    const tags = collectNoteTags(
      { tags: ["Recipe", "cooking", 1984, "Recipe"] },
      "Plan #TAG and #cooking, then #recipe again.",
    );

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

  it("returns an empty merged set when there are no tags", () => {
    expect(emptyNoteTagSet()).toEqual({
      frontmatter: [],
      inline: [],
      all: [],
    });
  });
});
