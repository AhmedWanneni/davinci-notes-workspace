import type {
  SqliteAdapter,
  SqliteQueryResult,
} from "@app/platform-adapters";
import {
  closeVaultIndexDb,
  getVaultIndexDb,
  withDbLock,
  withDbTransaction,
} from "../vault/sqliteIndex";

export class TauriSqliteAdapter implements SqliteAdapter {
  async execute(sql: string, params?: unknown[]): Promise<SqliteQueryResult> {
    return withDbLock(async () => {
      const db = await getVaultIndexDb();
      const res = await db.execute(sql, (params ?? []) as unknown[]);
      return {
        rowsAffected: res.rowsAffected,
        lastInsertId: res.lastInsertId,
      };
    });
  }

  async select<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return withDbLock(async () => {
      const db = await getVaultIndexDb();
      return db.select<T[]>(sql, (params ?? []) as unknown[]);
    });
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return withDbLock(async () => {
      const db = await getVaultIndexDb();
      return withDbTransaction(db, fn);
    });
  }

  async close(): Promise<void> {
    await closeVaultIndexDb();
  }
}
