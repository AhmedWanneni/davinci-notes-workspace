import * as SQLite from "expo-sqlite";
import { applyMigrations } from "./migrations";
import type { Fts5VerificationResult, SqliteDatabase } from "./types";

export const VAULT_INDEX_DB = "vault-index.db";

let dbPromise: Promise<SqliteDatabase> | undefined;
let dbLock: Promise<unknown> = Promise.resolve();
let currentLockDepth = 0;

/**
 * Universal serial lock queue for SQLite operations.
 * Ported from desktop ADR-0168 with re-entrancy guard to prevent recursive deadlocks.
 */
export function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  if (currentLockDepth > 0) {
    return fn();
  }

  const run = dbLock.then(async () => {
    currentLockDepth++;
    try {
      return await fn();
    } finally {
      currentLockDepth--;
    }
  });

  dbLock = run.catch(() => {});
  return run;
}

/** Sole transaction owner for the mobile vault-index connection. */
export async function withDbTransaction<T>(
  db: SqliteDatabase,
  fn: () => Promise<T>,
): Promise<T> {
  await db.execAsync("BEGIN IMMEDIATE;");
  try {
    const result = await fn();
    await db.execAsync("COMMIT;");
    return result;
  } catch (err) {
    try {
      await db.execAsync("ROLLBACK;");
    } catch (rollbackErr) {
      if (
        !(rollbackErr instanceof Error) ||
        !/no transaction is active/i.test(rollbackErr.message)
      ) {
        console.warn("SQLite rollback error:", rollbackErr);
      }
    }
    throw err;
  }
}

/**
 * Initializes and returns the singleton SQLite connection.
 * Sets busy_timeout BEFORE WAL and synchronous PRAGMAs.
 */
export async function getVaultIndexDb(): Promise<SqliteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const rawDb = await SQLite.openDatabaseAsync(VAULT_INDEX_DB);
      const db: SqliteDatabase = rawDb;

      await withDbLock(async () => {
        // Rule: busy_timeout BEFORE WAL-related PRAGMAs
        await db.execAsync("PRAGMA busy_timeout=5000;");
        await db.execAsync("PRAGMA journal_mode=WAL;");
        await db.execAsync("PRAGMA synchronous=NORMAL;");
        await db.execAsync("PRAGMA foreign_keys=ON;");
        await applyMigrations(db);
      });

      return db;
    })();
  }
  return dbPromise;
}

export async function closeVaultIndexDb(): Promise<void> {
  return withDbLock(async () => {
    if (dbPromise) {
      try {
        const db = await dbPromise;
        await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
        await db.closeAsync();
      } catch (err) {
        console.warn("[mobile-db] Error closing database:", err);
      } finally {
        dbPromise = undefined;
      }
    }
  });
}

/** Verifies that FTS5 is compiled into this SQLite build. */
export async function verifyFts5Support(
  db: SqliteDatabase,
): Promise<Fts5VerificationResult> {
  return withDbLock(async () => {
    const compileOptionsRows = await db.getAllAsync<Record<string, string>>(
      "PRAGMA compile_options;",
    );
    const compileOptions = compileOptionsRows.map(
      (r) => Object.values(r)[0] ?? "",
    );
    const hasCompileOption = compileOptions.some(
      (opt) => opt === "ENABLE_FTS5" || opt.includes("FTS5"),
    );

    let canCreateFts5 = false;
    let canMatchFts5 = false;
    let sampleResult: unknown = undefined;

    try {
      await db.execAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS _test_probe_fts5 USING fts5(content);",
      );
      canCreateFts5 = true;

      await db.runAsync(
        "INSERT INTO _test_probe_fts5 (content) VALUES (?);",
        "DaVinci Notes mobile FTS5 verification test",
      );

      const rows = await db.getAllAsync(
        "SELECT snippet(_test_probe_fts5, 0, '<mark>', '</mark>', '...', 10) as snippet, bm25(_test_probe_fts5) as score FROM _test_probe_fts5 WHERE _test_probe_fts5 MATCH ?;",
        '"DaVinci"',
      );
      if (rows.length > 0) {
        canMatchFts5 = true;
        sampleResult = rows[0];
      }
      await db.execAsync("DROP TABLE IF EXISTS _test_probe_fts5;");
    } catch (probeErr) {
      console.warn("[mobile-db] FTS5 probe check failed:", probeErr);
    }

    return {
      hasCompileOption,
      canCreateFts5,
      canMatchFts5,
      sampleResult,
      compileOptions,
    };
  });
}
