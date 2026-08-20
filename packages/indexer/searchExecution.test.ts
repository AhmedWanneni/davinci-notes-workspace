import { describe, expect, it } from "vitest";
import { buildTagIndex } from "./buildTags";
import { executeSearchQuery, type SearchDatabase } from "./searchExecution";
import { parseSearchQuery } from "./searchQuery";

const notes = [
  { path: "a.md", title: "Alpha", mtime: 1, frontmatter: {}, content: "meeting work", outlinks: [], tags: { frontmatter: [], inline: [], all: [{ key: "work", display: "#work", segments: ["work"] }] } },
  { path: "b.md", title: "Beta", mtime: 2, frontmatter: {}, content: "meeting inbox", outlinks: [], tags: { frontmatter: [], inline: [], all: [{ key: "inbox/to-read", display: "#inbox/to-read", segments: ["inbox", "to-read"] }] } },
  { path: "c.md", title: "Gamma", mtime: 3, frontmatter: {}, content: "meeting work", outlinks: [], tags: { frontmatter: [], inline: [], all: [{ key: "work", display: "#work", segments: ["work"] }] } },
];

function fakeDb(dataset = notes): SearchDatabase {
  return {
    async select<T>(query: string, bindings: unknown[] = []) {
      if (query.includes("notes_fts")) {
        const value = String(bindings[0]).replaceAll('"', "");
        return dataset
          .filter((note) => note.content.includes(value))
          .map((note, index) => ({ ...note, score: index, snippet: note.content })) as T[];
      }
      return dataset.map((note) => ({ path: note.path, title: note.title, mtime: note.mtime })) as T[];
    },
  };
}

describe("executeSearchQuery", () => {
  const tagIndex = buildTagIndex(notes);

  it("ANDs text and tag components and removes exclusions", async () => {
    const result = await executeSearchQuery(fakeDb(), tagIndex, parseSearchQuery("meeting tag:work"));
    expect(result.map((row) => row.path)).toEqual(["a.md", "c.md"]);
  });

  it("uses Phase 4 nested matching for tag-only queries", async () => {
    const result = await executeSearchQuery(fakeDb(), tagIndex, parseSearchQuery("tag:inbox"));
    expect(result.map((row) => row.path)).toEqual(["b.md"]);
  });

  it("ranks plain text deterministically and excludes terms", async () => {
    const result = await executeSearchQuery(fakeDb(), tagIndex, parseSearchQuery('meeting -"inbox"'));
    expect(result.map((row) => row.path)).toEqual(["a.md", "c.md"]);
  });

  it("keeps combined execution bounded on a 1,000-note benchmark", async () => {
    const benchmarkNotes = Array.from({ length: 1000 }, (_, index) => ({
      ...notes[index % notes.length]!,
      path: `bench/${index}.md`,
      title: `Benchmark ${index}`,
    }));
    const started = performance.now();
    const result = await executeSearchQuery(
      fakeDb(benchmarkNotes),
      buildTagIndex(benchmarkNotes),
      parseSearchQuery("meeting tag:work"),
    );
    expect(result).toHaveLength(667);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
