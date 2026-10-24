import { VAULT_INDEX_MIGRATIONS } from "@app/indexer";
import { getPlatformAdapters, isWebPlatformMode } from "@app/platform-adapters";
import Database from "@tauri-apps/plugin-sql";

/** Must match `db::DB_URL` in src-tauri. */
export const VAULT_INDEX_DB = "sqlite:vault-index.db";

let dbPromise: Promise<Database> | undefined;

let dbWriteLock: Promise<unknown> = Promise.resolve();
let currentLockDepth = 0;

/**
 * Retries transient SQLite locked / busy errors with exponential backoff.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 50,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLocked =
        err instanceof Error &&
        (err.message.includes("(code: 5)") ||
          err.message.includes("database is locked") ||
          err.message.includes("SQLITE_BUSY") ||
          /busy/i.test(err.message));
      if (isLocked && attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)),
        );
        continue;
      }
      throw err;
    }
  }
  throw new Error("withDbRetry exceeded maximum attempts");
}

/**
 * Universal serial lock queue for SQLite operations.
 * Includes re-entrancy guard to avoid recursive deadlocks and retry on busy.
 */
export function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  if (currentLockDepth > 0) {
    return withDbRetry(fn);
  }

  const run = dbWriteLock.then(async () => {
    currentLockDepth++;
    try {
      return await withDbRetry(fn);
    } finally {
      currentLockDepth--;
    }
  });

  dbWriteLock = run.catch(() => {});
  return run;
}

/**
 * Transaction coordinator for SQLite operations.
 * In desktop mode with tauri-plugin-sql connection pool, execute() delegates
 * to an underlying sqlx connection pool (up to 10 connections). Executing
 * raw "BEGIN" and "COMMIT" via separate execute() calls checks out arbitrary
 * connections, causing SQLite (code: 5) "database is locked" errors and leaving
 * uncommitted transactions open when rollback executes on a different connection.
 * Serialization and safety are guaranteed by withDbLock.
 */
export async function withDbTransaction<T>(
  _db: Database,
  fn: () => Promise<T>,
): Promise<T> {
  return fn();
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
        await db.execute("PRAGMA busy_timeout=10000;");
        try {
          await db.execute("PRAGMA journal_mode=WAL;");
        } catch {
          // May already be active
        }
        await db.execute("PRAGMA synchronous=NORMAL;");
        await db.execute("PRAGMA foreign_keys=ON;");
      });
      return db;
    });
  }
  return dbPromise;
}

/**
 * Flush WAL and checkpoint the database cleanly.
 * Uses PASSIVE checkpoint to avoid blocking active readers and never requires exclusive lock.
 */
export async function closeVaultIndexDb(): Promise<void> {
  return withDbLock(async () => {
    if (dbPromise) {
      try {
        const db = await dbPromise;
        await db.execute("PRAGMA wal_checkpoint(PASSIVE);");
      } catch (err) {
        console.warn("[vault] Error during db checkpoint:", err);
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

export {
  clearVaultIndex,
  persistNote,
  persistNotesBatch,
  removeNoteFromIndex,
  removeNotesBatch,
} from "./sqliteNotePersistence";

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
