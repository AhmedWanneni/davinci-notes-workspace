import { describe, expect, it } from "vitest";
import { buildTagIndex, queryNotesByTag } from "./buildTags";
import {
  createDefaultSearchOperatorRegistry,
  parseSearchQuery,
} from "./searchQuery";

describe("parseSearchQuery", () => {
  it("parses terms, exact phrases, and both tag forms", () => {
    const result = parseSearchQuery('meeting "project kickoff" tag:#Work tag:inbox');
    expect(result.errors).toEqual([]);
    expect(result.clauses).toEqual([
      { excluded: false, value: "meeting", phrase: false },
      { excluded: false, value: "project kickoff", phrase: true },
      { excluded: false, value: "#Work", phrase: false, operator: { kind: "tag", tagKey: "work" } },
      { excluded: false, value: "inbox", phrase: false, operator: { kind: "tag", tagKey: "inbox" } },
    ]);
  });

  it("preserves exclusions for terms and operators", () => {
    expect(parseSearchQuery('-meeting -tag:archive').clauses).toEqual([
      { excluded: true, value: "meeting", phrase: false },
      { excluded: true, value: "archive", phrase: false, operator: { kind: "tag", tagKey: "archive" } },
    ]);
  });

  it("reports empty tag values and ignores empty queries", () => {
    expect(parseSearchQuery("")).toEqual({ clauses: [], errors: [] });
    expect(parseSearchQuery("tag:")).toEqual({
      clauses: [],
      errors: [{ token: "tag:", message: "Operator tag: requires a value" }],
    });
  });

  it("falls back to plain text for unknown operators", () => {
    expect(parseSearchQuery("foo:bar").clauses).toEqual([
      { excluded: false, value: "foo:bar", phrase: false },
    ]);
  });

  it("feeds the tag key directly into Phase 4 nested matching", () => {
    const parsed = parseSearchQuery("tag:inbox");
    const clause = parsed.clauses[0]?.operator;
    const index = buildTagIndex([
      { path: "root.md", title: "Root", mtime: 1, frontmatter: {}, content: "", outlinks: [], tags: { frontmatter: [], inline: [], all: [{ key: "inbox", display: "#inbox", segments: ["inbox"] }] } },
      { path: "child.md", title: "Child", mtime: 1, frontmatter: {}, content: "", outlinks: [], tags: { frontmatter: [], inline: [], all: [{ key: "inbox/to-read", display: "#inbox/to-read", segments: ["inbox", "to-read"] }] } },
    ]);
    expect(clause?.kind).toBe("tag");
    expect(queryNotesByTag(index, (clause as { tagKey: string }).tagKey)).toEqual(new Set(["root.md", "child.md"]));
  });

  it("supports a registered operator without changing tokenization", () => {
    const registry = new Map(createDefaultSearchOperatorRegistry());
    registry.set("test", (value) => ({ kind: "test", value }));
    expect(parseSearchQuery("alpha test:value", registry).clauses[1]).toEqual({
      excluded: false,
      value: "value",
      phrase: false,
      operator: { kind: "test", value: "value" },
    });
  });
});
