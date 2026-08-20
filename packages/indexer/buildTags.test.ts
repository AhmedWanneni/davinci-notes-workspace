import { describe, expect, it } from "vitest";
import type { Note } from "@app/core-types";
import {
  buildTagIndex,
  createEmptyTagIndex,
  getCanonicalTag,
  queryNotesByTag,
  removeNoteFromTagIndex,
  updateTagIndexForNote,
} from "./buildTags";

describe("TagIndex", () => {
  const note1: Note = {
    path: "note1.md",
    title: "Note 1",
    mtime: 100,
    frontmatter: {},
    content: "#Inbox #Recipe",
    outlinks: [],
    tags: {
      frontmatter: [],
      inline: [],
      all: [
        { key: "inbox", display: "#Inbox", segments: ["Inbox"] },
        { key: "recipe", display: "#Recipe", segments: ["Recipe"] },
      ],
    },
  };

  const note2: Note = {
    path: "note2.md",
    title: "Note 2",
    mtime: 200,
    frontmatter: {},
    content: "#inbox/to-read",
    outlinks: [],
    tags: {
      frontmatter: [],
      inline: [],
      all: [
        { key: "inbox/to-read", display: "#inbox/to-read", segments: ["inbox", "to-read"] },
      ],
    },
  };

  const note3: Note = {
    path: "note3.md",
    title: "Note 3",
    mtime: 50,
    frontmatter: {},
    content: "#recipe #cooking",
    outlinks: [],
    tags: {
      frontmatter: [],
      inline: [],
      all: [
        { key: "recipe", display: "#recipe", segments: ["recipe"] },
        { key: "cooking", display: "#cooking", segments: ["cooking"] },
      ],
    },
  };

  it("builds a full tag index and respects first-seen casing (oldest mtime)", () => {
    const index = buildTagIndex([note1, note2, note3]);

    // note3 (mtime 50) is the oldest usage of "recipe"
    expect(getCanonicalTag(index, "recipe")?.display).toBe("#recipe");
    // note1 (mtime 100) is the oldest usage of "inbox"
    expect(getCanonicalTag(index, "inbox")?.display).toBe("#Inbox");
  });

  it("handles incremental updates", () => {
    const index = createEmptyTagIndex();
    updateTagIndexForNote(index, note1);
    expect(getCanonicalTag(index, "recipe")?.display).toBe("#Recipe");

    // note3 is older than note1
    updateTagIndexForNote(index, note3);
    expect(getCanonicalTag(index, "recipe")?.display).toBe("#recipe");
  });

  it("handles nested tag query semantics", () => {
    const index = buildTagIndex([note1, note2, note3]);

    // Query for "inbox" returns "inbox" and "inbox/to-read"
    const inboxNotes = queryNotesByTag(index, "inbox");
    expect(inboxNotes.has("note1.md")).toBe(true);
    expect(inboxNotes.has("note2.md")).toBe(true);

    // Query for "inbox/to-read" returns only itself
    const nestedNotes = queryNotesByTag(index, "inbox/to-read");
    expect(nestedNotes.has("note1.md")).toBe(false);
    expect(nestedNotes.has("note2.md")).toBe(true);
  });

  it("handles canonical casing fallback when the oldest note is removed", () => {
    const index = buildTagIndex([note1, note3]);
    expect(getCanonicalTag(index, "recipe")?.display).toBe("#recipe"); // note3 is oldest

    removeNoteFromTagIndex(index, "note3.md");

    // Falls back to note1's casing
    expect(getCanonicalTag(index, "recipe")?.display).toBe("#Recipe");
  });

  it("builds and queries a 1,000-note nested-tag vault within the benchmark budget", () => {
    const notes = Array.from({ length: 1000 }, (_, index) => ({
      path: `note-${index}.md`,
      title: `Note ${index}`,
      mtime: index,
      frontmatter: {},
      content: `#inbox/to-read/${index % 10}`,
      outlinks: [],
      tags: {
        frontmatter: [],
        inline: [],
        all: [{
          key: `inbox/to-read/${index % 10}`,
          display: `#inbox/to-read/${index % 10}`,
          segments: ["inbox", "to-read", String(index % 10)],
        }],
      },
    }));
    const started = performance.now();
    const index = buildTagIndex(notes);
    const matches = queryNotesByTag(index, "inbox");
    const elapsedMs = performance.now() - started;

    expect(matches.size).toBe(1000);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
