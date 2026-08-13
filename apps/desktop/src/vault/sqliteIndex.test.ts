import type { Note } from "@app/core-types";
import type Database from "@tauri-apps/plugin-sql";
import { describe, expect, it, vi } from "vitest";

import { persistNotesBatch } from "./sqliteIndex";

describe("sqliteIndex persistNotesBatch", () => {
  it("does nothing when notes array is empty", async () => {
    const execute = vi.fn();
    const db = { execute } as unknown as Database;

    await persistNotesBatch(db, []);
    expect(execute).not.toHaveBeenCalled();
  });

  it("persists notes and outlinks in chunked batches", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const db = { execute } as unknown as Database;

    const testNotes: Note[] = [
      {
        path: "note1.md",
        title: "Note 1",
        frontmatter: { tags: ["a"] },
        content: "# Note 1",
        tags: ["a"],
        mtime: 100,
        outlinks: [
          {
            target: "note2.md",
            targetRaw: "note2",
            displayText: "Note 2",
            type: "wikilink",
            resolved: true,
          },
        ],
      },
      {
        path: "note2.md",
        title: "Note 2",
        frontmatter: {},
        content: "# Note 2",
        tags: [],
        mtime: 200,
        outlinks: [
          {
            target: "note1.md",
            targetRaw: "note1",
            heading: "Section 1",
            type: "wikilink",
            resolved: true,
          },
          {
            target: "note1.md",
            targetRaw: "note1#Section 2",
            heading: "Section 2",
            type: "wikilink",
            resolved: true,
          },
        ],
      },
    ];

    await persistNotesBatch(db, testNotes, 50);

    // Call 1: Bulk notes upsert
    expect(execute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO notes"),
      [
        "note1.md",
        "Note 1",
        '{"tags":["a"]}',
        100,
        "note2.md",
        "Note 2",
        "{}",
        200,
      ],
    );

    // Call 2: Delete existing links for source paths
    expect(execute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "DELETE FROM links WHERE source_path IN ($1, $2)",
      ),
      ["note1.md", "note2.md"],
    );

    // Call 3: Bulk links insert
    expect(execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO links"),
      [
        "note1.md",
        "note2.md",
        "note2",
        "Note 2",
        null,
        null,
        1,
        "note2.md",
        "note1.md",
        "note1",
        null,
        "Section 1",
        null,
        1,
        "note2.md",
        "note1.md",
        "note1#Section 2",
        null,
        "Section 2",
        null,
        1,
      ],
    );
  });

  it("queries PRAGMA journal_mode via verifyJournalMode", async () => {
    const { verifyJournalMode } = await import("./sqliteIndex");
    const select = vi.fn().mockResolvedValue([{ journal_mode: "wal" }]);
    const db = { select } as unknown as Database;

    const mode = await verifyJournalMode(db);
    expect(select).toHaveBeenCalledWith("PRAGMA journal_mode;");
    expect(mode).toBe("wal");
  });
});
