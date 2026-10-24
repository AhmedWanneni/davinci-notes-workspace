export interface SqliteQueryResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface SqliteAdapter {
  execute(sql: string, params?: unknown[]): Promise<SqliteQueryResult>;
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
