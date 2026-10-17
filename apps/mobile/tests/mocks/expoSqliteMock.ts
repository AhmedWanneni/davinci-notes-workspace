import { DatabaseSync } from "node:sqlite";

export class MockSQLiteDatabase {
  private syncDb: DatabaseSync;

  constructor(dbName: string) {
    this.syncDb = new DatabaseSync(
      dbName === ":memory:" ? ":memory:" : ":memory:",
    );
  }

  async execAsync(source: string): Promise<void> {
    this.syncDb.exec(source);
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    const flatParams = params.flat() as (
      null | number | bigint | string | Uint8Array
    )[];
    const query = source.replace(/\$\d+/g, "?");
    const stmt = this.syncDb.prepare(query);
    return stmt.all(...flatParams) as T[];
  }

  async runAsync(
    source: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const flatParams = params.flat() as (
      null | number | bigint | string | Uint8Array
    )[];
    const query = source.replace(/\$\d+/g, "?");
    const stmt = this.syncDb.prepare(query);
    const result = stmt.run(...flatParams);
    return {
      lastInsertRowId: Number(result.lastInsertRowid ?? 0),
      changes: Number(result.changes ?? 0),
    };
  }

  async closeAsync(): Promise<void> {
    this.syncDb.close();
  }
}

export async function openDatabaseAsync(
  dbName: string,
): Promise<MockSQLiteDatabase> {
  return new MockSQLiteDatabase(dbName);
}
