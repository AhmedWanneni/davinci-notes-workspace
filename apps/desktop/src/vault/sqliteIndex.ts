import type { Note } from "@app/core-types";
import { VAULT_INDEX_MIGRATIONS } from "@app/indexer";
import { getPlatformAdapters, isWebPlatformMode } from "@app/platform-adapters";
import Database from "@tauri-apps/plugin-sql";
import { clearFtsRows, removeFtsRows, replaceFtsRows } from "./sqliteFtsIndex";
import {
  clearReminders,
  removeRemindersBatch,
  replaceRemindersBatch,
} from "./sqliteReminderIndex";

/** Must match `db::DB_URL` in src-tauri. */
export const VAULT_INDEX_DB = "sqlite:vault-index.db";

let dbPromise: Promise<Database> | undefined;

let dbWriteLock: Promise<unknown> = Promise.resolve();

export function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = dbWriteLock.then(fn, fn);
  dbWriteLock = run.catch(() => {});
  return run;
}

/** The sole transaction owner for the vault-index connection. */
export async function withDbTransaction<T>(
  db: Database,
  fn: () => Promise<T>,
): Promise<T> {
  await db.execute("BEGIN IMMEDIATE");
  try {
    const result = await fn();
    await db.execute("COMMIT");
    return result;
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch (rollbackError) {
      if (
        !(rollbackError instanceof Error) ||
        !/no transaction is active/i.test(rollbackError.message)
      ) {
        console.warn(
          "SQLite rollback was unavailable after a failed transaction",
          rollbackError,
        );
      }
    }
    throw error;
  }
}

export async function getVaultIndexDb(): Promise<Database> {
  if (isWebPlatformMode()) {
    if (!dbPromise) {
      dbPromise = (async () => {
        const sqlite = getPlatformAdapters().sqlite;
        for (const migration of VAULT_INDEX_MIGRATIONS) {
          await sqlite.execute(migration.sql);
        }
        return sqlite as unknown as Database;
      })();
    }
    return dbPromise;
  }
  if (!dbPromise) {
    dbPromise = Database.load(VAULT_INDEX_DB).then(async (db) => {
      await withDbLock(async () => {
        await db.execute("PRAGMA busy_timeout=5000;");
        await db.execute("PRAGMA journal_mode=WAL;");
        await db.execute("PRAGMA synchronous=NORMAL;");
        await db.execute("PRAGMA foreign_keys=ON;");
      });
      return db;
    });
  }
  return dbPromise;
}

/**
 * Flush WAL and cleanly close the database connection pool.
 * Runs inside the single withDbLock queue to ensure all queued reads/writes finish first.
 */
export async function closeVaultIndexDb(): Promise<void> {
  return withDbLock(async () => {
    if (dbPromise) {
      try {
        const db = await dbPromise;
        await db.execute("PRAGMA wal_checkpoint(TRUNCATE);");
        await db.close();
      } catch (err) {
        console.warn("[vault] Error during db close/checkpoint:", err);
      } finally {
        dbPromise = undefined;
      }
    }
  });
}

export async function verifyJournalMode(db: Database): Promise<string> {
  const rows = await db.select<{ journal_mode: string }[]>(
    "PRAGMA journal_mode;",
  );
  return rows[0]?.journal_mode?.toLowerCase() ?? "unknown";
}

export async function clearVaultIndex(db: Database): Promise<void> {
  await db.execute("DELETE FROM links");
  await db.execute("DELETE FROM notes");
  await clearFtsRows(db);
  await clearReminders(db);
}

/** Batch remove notes, links, and FTS rows in chunked operations. */
export async function removeNotesBatch(
  db: Database,
  paths: readonly string[],
  batchSize = 50,
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  for (let i = 0; i < paths.length; i += batchSize) {
    const chunk = paths.slice(i, i + batchSize);
    const placeholders = chunk.map((_, idx) => `$${idx + 1}`).join(", ");
    await db.execute(
      `DELETE FROM notes WHERE path IN (${placeholders})`,
      chunk,
    );
    await db.execute(
      `DELETE FROM links WHERE source_path IN (${placeholders}) OR target_path IN (${placeholders})`,
      chunk,
    );
    await removeFtsRows(db, chunk);
    await removeRemindersBatch(db, chunk, batchSize);
  }
}

export async function removeNoteFromIndex(
  db: Database,
  path: string,
): Promise<void> {
  await removeNotesBatch(db, [path]);
}

/** Batch persist notes and outlinks to SQLite using chunked bulk operations. */
export async function persistNotesBatch(
  db: Database,
  notes: readonly Note[],
  batchSize = 50,
): Promise<void> {
  if (notes.length === 0) {
    return;
  }

  for (let i = 0; i < notes.length; i += batchSize) {
    const chunk = notes.slice(i, i + batchSize);

    // 1. Bulk upsert notes
    const noteClauses: string[] = [];
    const noteParams: unknown[] = [];
    let pIdx = 1;

    for (const note of chunk) {
      noteClauses.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3})`);
      noteParams.push(
        note.path,
        note.title,
        JSON.stringify(note.frontmatter),
        note.mtime,
      );
      pIdx += 4;
    }

    await db.execute(
      `INSERT INTO notes (path, title, frontmatter, mtime)
       VALUES ${noteClauses.join(", ")}
       ON CONFLICT(path) DO UPDATE SET
         title = excluded.title,
         frontmatter = excluded.frontmatter,
         mtime = excluded.mtime`,
      noteParams,
    );

    // 2. Delete existing links for batch source paths
    const sourcePaths = chunk.map((n) => n.path);
    const inClauses = sourcePaths.map((_, idx) => `$${idx + 1}`).join(", ");
    await db.execute(
      `DELETE FROM links WHERE source_path IN (${inClauses})`,
      sourcePaths,
    );

    // 3. Bulk insert outlinks (chunked by batchSize to keep parameter count low)
    const allOutlinks: {
      sourcePath: string;
      link: (typeof chunk)[0]["outlinks"][0];
    }[] = [];
    for (const note of chunk) {
      for (const link of note.outlinks) {
        allOutlinks.push({ sourcePath: note.path, link });
      }
    }

    if (allOutlinks.length > 0) {
      for (let j = 0; j < allOutlinks.length; j += batchSize) {
        const linkChunk = allOutlinks.slice(j, j + batchSize);
        const linkClauses: string[] = [];
        const linkParams: unknown[] = [];
        let lIdx = 1;

        for (const item of linkChunk) {
          linkClauses.push(
            `($${lIdx}, $${lIdx + 1}, $${lIdx + 2}, $${lIdx + 3}, $${lIdx + 4}, $${lIdx + 5}, $${lIdx + 6})`,
          );
          linkParams.push(
            item.sourcePath,
            item.link.target,
            item.link.targetRaw,
            item.link.displayText ?? null,
            item.link.heading ?? null,
            item.link.blockId ?? null,
            item.link.resolved ? 1 : 0,
          );
          lIdx += 7;
        }

        await db.execute(
          `INSERT INTO links (
             source_path, target_path, target_raw, display_text,
             heading, block_id, resolved
           ) VALUES ${linkClauses.join(", ")}`,
          linkParams,
        );
      }
    }

    await replaceFtsRows(db, chunk);
    await replaceRemindersBatch(db, chunk, batchSize);
  }
}

export async function persistNote(db: Database, note: Note): Promise<void> {
  await persistNotesBatch(db, [note]);
}

export {
  countIndexedNotes,
  listIndexedNotePaths,
  queryBacklinkSources,
} from "./sqliteNoteQueries";
export { queryFullGraphIndex } from "./sqliteGraphIndex";
export {
  clearReminders,
  queryOverdueReminders,
  queryRemindersByNote,
  queryUpcomingReminders,
  removeRemindersBatch,
  replaceRemindersBatch,
  type ReminderRow,
} from "./sqliteReminderIndex";
