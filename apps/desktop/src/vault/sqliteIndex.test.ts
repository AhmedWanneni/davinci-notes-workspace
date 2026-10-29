import { emptyNoteTagSet, type Note } from "@app/core-types";
import type Database from "@tauri-apps/plugin-sql";
import { describe, expect, it, vi } from "vitest";

import { setSetting } from "./settingsCommands";
import { saveGitRemoteConfig } from "../git/GitRemoteConfig";
import { SqliteEmbeddingStore } from "../../../../packages/ai-embeddings/EmbeddingStore";
import {
  persistNotesBatch,
  withDbLock,
  withDbTransaction,
} from "./sqliteIndex";

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
        tags: emptyNoteTagSet(),
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
        tags: emptyNoteTagSet(),
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

    expect(execute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("DELETE FROM notes_fts"),
      ["note1.md", "note2.md"],
    );
    expect(execute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("INSERT INTO notes_fts"),
      ["note1.md", "# Note 1", "note2.md", "# Note 2"],
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

  it("preserves the original failure during transactional work", async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error("constraint failed"));
    const db = { execute } as unknown as Database;

    await expect(
      withDbTransaction(db, async () => {
        await db.execute("INSERT INTO embedding_chunks VALUES (...) ");
      }),
    ).rejects.toThrow("constraint failed");
  });

  it("serializes indexing, reads, embedding, and settings operations", async () => {
    let activeWriters = 0;
    let maximumActiveWriters = 0;
    const statements: string[] = [];
    const execute = vi.fn(async (sql: string) => {
      activeWriters += 1;
      maximumActiveWriters = Math.max(maximumActiveWriters, activeWriters);
      await new Promise((resolve) => setTimeout(resolve, 1));
      statements.push(sql);
      activeWriters -= 1;
    });
    const db = {
      execute,
      select: vi.fn(async () => {
        activeWriters += 1;
        maximumActiveWriters = Math.max(maximumActiveWriters, activeWriters);
        await new Promise((resolve) => setTimeout(resolve, 1));
        activeWriters -= 1;
        return [];
      }),
    } as unknown as Database;
    const embeddingStore = new SqliteEmbeddingStore(db, withDbLock);

    await Promise.all([
      withDbLock(() =>
        withDbTransaction(db, async () => {
          await db.execute("DELETE FROM notes");
          await db.execute("DELETE FROM links");
        }),
      ),
      embeddingStore.upsert({
        chunk: {
          id: "chunk-1",
          notePath: "note.md",
          heading: null,
          startLine: 1,
          endLine: 1,
          text: "indexed text",
        },
        contentHash: "hash",
        model: "test-model",
        vector: [1, 0],
      }),
      withDbLock(() => setSetting(db, "editorFont", "inter")),
      saveGitRemoteConfig(db, {
        remoteUrl: "https://gitlab.com/example/notes.git",
        username: null,
      }),
      withDbLock(() =>
        db.select("SELECT value FROM settings WHERE key = $1", [
          "ai.provider.id",
        ]),
      ),
    ]);

    expect(maximumActiveWriters).toBe(1);
    expect(statements).toEqual(
      expect.arrayContaining([
        "DELETE FROM notes",
        "DELETE FROM links",
        expect.stringContaining("INSERT INTO embedding_chunks"),
        expect.stringContaining("INSERT INTO settings"),
      ]),
    );
  });

  it("removes notes, links, and FTS rows in batched chunks", async () => {
    const { removeNotesBatch } = await import("./sqliteIndex");
    const execute = vi.fn().mockResolvedValue(undefined);
    const db = { execute } as unknown as Database;

    await removeNotesBatch(db, ["note1.md", "note2.md"]);

    expect(execute).toHaveBeenNthCalledWith(
      1,
      "DELETE FROM notes WHERE path IN ($1, $2)",
      ["note1.md", "note2.md"],
    );
    expect(execute).toHaveBeenNthCalledWith(2, "DELETE FROM links WHERE source_path IN ($1, $2) OR target_path IN ($1, $2)", ["note1.md", "note2.md"]);
    expect(execute).toHaveBeenNthCalledWith(3, "DELETE FROM notes_fts WHERE path IN ($1, $2)", ["note1.md", "note2.md"]);
  });
});
