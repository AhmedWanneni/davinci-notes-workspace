import { describe, expect, it } from "vitest";
import { WebSqliteAdapter } from "./WebSqliteAdapter";
import { withWebDbLock } from "./tabLockCoordinator";

const MIGRATION_SQLS = [
  `CREATE TABLE IF NOT EXISTS notes (path TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, frontmatter TEXT NOT NULL DEFAULT '{}', mtime INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS note_tags (path TEXT NOT NULL, tag_key TEXT NOT NULL, tag_display TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL, target_path TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(path UNINDEXED, content);`,
  `CREATE TABLE IF NOT EXISTS embedding_chunks (chunk_id TEXT PRIMARY KEY NOT NULL);`,
  `ALTER TABLE embedding_chunks ADD COLUMN text TEXT NOT NULL DEFAULT '';`,
  `CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT);`,
  `CREATE TABLE IF NOT EXISTS reminder_local_state (reminder_key TEXT PRIMARY KEY NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS google_calendars (id TEXT PRIMARY KEY NOT NULL);
   CREATE TABLE IF NOT EXISTS google_calendar_events (id TEXT PRIMARY KEY NOT NULL);
   CREATE TABLE IF NOT EXISTS google_calendar_sync_state (calendar_id TEXT PRIMARY KEY NOT NULL);`,
];

describe("Phase 3: WebSqliteAdapter & Universal Lock Discipline", () => {
  it("runs all 8 versioned migrations sequentially and records schema tables", async () => {
    const db = new WebSqliteAdapter();
    for (const sql of MIGRATION_SQLS) {
      await db.execute(sql);
    }

    const tables = await db.select<{ type: string; name: string }>(
      "SELECT type, name FROM sqlite_master WHERE type = 'table'",
    );
    const names = tables.map((t) => t.name);

    expect(names).toContain("notes");
    expect(names).toContain("links");
    expect(names).toContain("settings");
    expect(names).toContain("notes_fts");
    expect(names).toContain("embedding_chunks");
    expect(names).toContain("reminders");
    expect(names).toContain("reminder_local_state");
    expect(names).toContain("google_calendars");
  });

  it("serializes 25 concurrent reads and writes through withWebDbLock without contention", async () => {
    const db = new WebSqliteAdapter();
    const executionOrder: number[] = [];

    const operations = Array.from({ length: 25 }, (_, idx) =>
      db
        .execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [
          `key-${idx}`,
          `val-${idx}`,
        ])
        .then(() => {
          executionOrder.push(idx);
        }),
    );

    await Promise.all(operations);

    expect(executionOrder).toHaveLength(25);
    expect(executionOrder).toEqual(Array.from({ length: 25 }, (_, i) => i));

    const rows = await db.select<{ key: string; value: string }>(
      "SELECT key, value FROM settings",
    );
    expect(rows).toHaveLength(25);
  });

  it("rolls back uncommitted changes when a transaction throws", async () => {
    const db = new WebSqliteAdapter();
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      ["theme", "dark"],
    );

    await expect(
      db.withTransaction(async () => {
        await db.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          ["theme", "corrupted"],
        );
        throw new Error("Simulated write failure");
      }),
    ).rejects.toThrow("Simulated write failure");

    const rows = await db.select<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key = ?",
      ["theme"],
    );
    expect(rows[0]?.value).toBe("dark");
  });

  it("executes FTS5 full-text search and ranks documents by term frequency (BM25)", async () => {
    const db = new WebSqliteAdapter();

    await db.execute("INSERT INTO notes_fts (path, content) VALUES (?, ?)", [
      "notes/low.md",
      "A single mention of urgent meeting here.",
      "notes/high.md",
      "Urgent meeting today! Please prepare for the urgent meeting and review urgent meeting notes.",
      "notes/unrelated.md",
      "Grocery shopping list: apples and bananas.",
    ]);

    const results = await db.select<{ path: string; score: number }>(
      "SELECT path, bm25(notes_fts) as score FROM notes_fts WHERE notes_fts MATCH ?",
      ['"urgent" "meeting"'],
    );

    expect(results).toHaveLength(2);
    expect(results[0].path).toBe("notes/high.md");
    expect(results[1].path).toBe("notes/low.md");
    expect(results[0].score).toBeLessThan(results[1].score);
  });
});
