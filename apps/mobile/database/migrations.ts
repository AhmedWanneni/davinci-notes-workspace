import type { SqliteDatabase } from "./types";

export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS notes (
        path TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        frontmatter TEXT NOT NULL DEFAULT '{}',
        mtime INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS note_tags (
        path TEXT NOT NULL,
        tag_key TEXT NOT NULL,
        tag_display TEXT NOT NULL,
        PRIMARY KEY (path, tag_key),
        FOREIGN KEY (path) REFERENCES notes(path) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_key);
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_path TEXT NOT NULL,
        target_path TEXT NOT NULL,
        target_raw TEXT NOT NULL,
        display_text TEXT,
        heading TEXT,
        block_id TEXT,
        resolved INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (source_path) REFERENCES notes(path) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_path);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(path UNINDEXED, content);
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_path TEXT NOT NULL,
        line INTEGER NOT NULL,
        due_at_utc TEXT NOT NULL,
        tz TEXT NOT NULL,
        text TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (note_path) REFERENCES notes(path) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_reminders_done_due ON reminders(done, due_at_utc);
      CREATE INDEX IF NOT EXISTS idx_reminders_note_path ON reminders(note_path);
    `,
  },
];

export async function applyMigrations(db: SqliteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _mobile_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    "SELECT version FROM _mobile_migrations ORDER BY version ASC",
  );
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  for (const m of MIGRATIONS) {
    if (!appliedSet.has(m.version)) {
      await db.execAsync(m.sql);
      await db.runAsync(
        "INSERT INTO _mobile_migrations (version, applied_at) VALUES (?, ?)",
        m.version,
        Date.now(),
      );
    }
  }
}
