import type {
  SqliteAdapter,
  SqliteQueryResult,
} from "../SqliteAdapter";
import { withWebDbLock } from "./tabLockCoordinator";
import {
  cloneTableStore,
  createInitialTableStore,
  executeWebSql,
  type TableStore,
} from "./webSqlEngine";
import { selectWebSql } from "./webSqlSelect";

export interface SqliteDriver {
  execute(sql: string, params?: unknown[]): Promise<SqliteQueryResult>;
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

export class WebSqliteAdapter implements SqliteAdapter {
  private readonly driver?: SqliteDriver;
  private store: TableStore = createInitialTableStore();
  private autoId = 1;
  private inTransaction = false;

  constructor(driver?: SqliteDriver) {
    this.driver = driver;
  }

  async execute(sql: string, params: unknown[] = []): Promise<SqliteQueryResult> {
    const run = async () => {
      if (this.driver) {
        return this.driver.execute(sql, params);
      }
      return executeWebSql(this.store, sql, params, () => this.autoId++);
    };
    return this.inTransaction ? run() : withWebDbLock(run);
  }

  async select<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const run = async () => {
      if (this.driver) {
        return this.driver.select<T>(sql, params);
      }
      return selectWebSql<T>(this.store, sql, params);
    };
    return this.inTransaction ? run() : withWebDbLock(run);
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return withWebDbLock(async () => {
      this.inTransaction = true;
      if (this.driver) {
        await this.driver.execute("BEGIN IMMEDIATE");
        try {
          const res = await fn();
          await this.driver.execute("COMMIT");
          return res;
        } catch (err) {
          await this.driver.execute("ROLLBACK").catch(() => {});
          throw err;
        } finally {
          this.inTransaction = false;
        }
      }

      const snapshot = cloneTableStore(this.store);
      try {
        return await fn();
      } catch (err) {
        this.store = snapshot;
        throw err;
      } finally {
        this.inTransaction = false;
      }
    });
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
  }
}
