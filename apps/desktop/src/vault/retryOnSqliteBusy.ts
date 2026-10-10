/**
 * Check whether an error is a SQLite busy/locked contention error.
 */
export function isSqliteBusyError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("code: 5") ||
    message.includes("database is locked") ||
    message.includes("busy")
  );
}

/**
 * Retries an idempotent async database operation with exponential backoff
 * when encountering SQLITE_BUSY / database is locked.
 */
export async function retryOnSqliteBusy<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isSqliteBusyError(error)) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("retryOnSqliteBusy: unreachable");
}
