export interface SqliteDatabase {
  execAsync(query: string): Promise<void>;
  getAllAsync<T>(query: string, ...params: unknown[]): Promise<T[]>;
  runAsync(
    query: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  closeAsync(): Promise<void>;
}

export interface SearchDatabase {
  select<T>(query: string, bindings?: unknown[]): Promise<T[]>;
}

export interface Fts5VerificationResult {
  hasCompileOption: boolean;
  canCreateFts5: boolean;
  canMatchFts5: boolean;
  sampleResult?: unknown;
  compileOptions: string[];
}
