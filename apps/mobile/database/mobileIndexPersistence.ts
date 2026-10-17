import type { Note } from "@app/core-types";
import type { SearchDatabase, SqliteDatabase } from "./types";
import { withDbLock } from "./mobileSqlite";

export function createMobileSearchDatabase(db: SqliteDatabase): SearchDatabase {
  return {
    async select<T>(query: string, bindings: unknown[] = []): Promise<T[]> {
      return withDbLock(() => db.getAllAsync<T>(query, ...bindings));
    },
  };
}

export async function clearVaultIndex(db: SqliteDatabase): Promise<void> {
  await db.execAsync("DELETE FROM links;");
  await db.execAsync("DELETE FROM note_tags;");
  await db.execAsync("DELETE FROM notes;");
  await db.execAsync("DELETE FROM notes_fts;");
}

export async function removeNotesBatch(
  db: SqliteDatabase,
  paths: readonly string[],
  batchSize = 50,
): Promise<void> {
  if (paths.length === 0) return;

  for (let i = 0; i < paths.length; i += batchSize) {
    const chunk = paths.slice(i, i + batchSize);
    const placeholders = chunk.map(() => "?").join(", ");

    await db.runAsync(
      `DELETE FROM notes WHERE path IN (${placeholders})`,
      ...chunk,
    );
    await db.runAsync(
      `DELETE FROM links WHERE source_path IN (${placeholders}) OR target_path IN (${placeholders})`,
      ...chunk,
      ...chunk,
    );
    await db.runAsync(
      `DELETE FROM note_tags WHERE path IN (${placeholders})`,
      ...chunk,
    );
    await db.runAsync(
      `DELETE FROM notes_fts WHERE path IN (${placeholders})`,
      ...chunk,
    );
  }
}

export async function persistNotesBatch(
  db: SqliteDatabase,
  notes: readonly Note[],
  batchSize = 50,
): Promise<void> {
  if (notes.length === 0) return;

  for (let i = 0; i < notes.length; i += batchSize) {
    const chunk = notes.slice(i, i + batchSize);

    // 1. Bulk upsert notes
    const noteClauses: string[] = [];
    const noteParams: unknown[] = [];
    for (const note of chunk) {
      noteClauses.push("(?, ?, ?, ?)");
      noteParams.push(
        note.path,
        note.title,
        JSON.stringify(note.frontmatter ?? {}),
        note.mtime,
      );
    }

    await db.runAsync(
      `INSERT INTO notes (path, title, frontmatter, mtime)
       VALUES ${noteClauses.join(", ")}
       ON CONFLICT(path) DO UPDATE SET
         title = excluded.title,
         frontmatter = excluded.frontmatter,
         mtime = excluded.mtime;`,
      ...noteParams,
    );

    // 2. Links: clear and re-insert for chunk
    const sourcePaths = chunk.map((n) => n.path);
    const inPlaceholders = sourcePaths.map(() => "?").join(", ");
    await db.runAsync(
      `DELETE FROM links WHERE source_path IN (${inPlaceholders});`,
      ...sourcePaths,
    );

    const outlinks: unknown[] = [];
    const linkClauses: string[] = [];
    for (const note of chunk) {
      for (const link of note.outlinks) {
        linkClauses.push("(?, ?, ?, ?, ?, ?, ?)");
        outlinks.push(
          note.path,
          link.target,
          link.targetRaw,
          link.displayText ?? null,
          link.heading ?? null,
          link.blockId ?? null,
          link.resolved ? 1 : 0,
        );
      }
    }

    if (linkClauses.length > 0) {
      await db.runAsync(
        `INSERT INTO links (source_path, target_path, target_raw, display_text, heading, block_id, resolved)
         VALUES ${linkClauses.join(", ")};`,
        ...outlinks,
      );
    }

    // 3. FTS5 full-text indexing
    await db.runAsync(
      `DELETE FROM notes_fts WHERE path IN (${inPlaceholders});`,
      ...sourcePaths,
    );

    const ftsClauses: string[] = [];
    const ftsParams: string[] = [];
    for (const note of chunk) {
      ftsClauses.push("(?, ?)");
      ftsParams.push(note.path, note.content);
    }

    if (ftsClauses.length > 0) {
      await db.runAsync(
        `INSERT INTO notes_fts (path, content) VALUES ${ftsClauses.join(", ")};`,
        ...ftsParams,
      );
    }
  }
}
