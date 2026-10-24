export const VAULT_INDEX_WEB_LOCK_NAME = "davinci-vault-index-db";

let localLockChain: Promise<unknown> = Promise.resolve();

/**
 * Serializes all reads and writes against the vault index database across
 * async calls and browser tabs (via Web Locks API when available), matching ADR-0168.
 */
export function withWebDbLock<T>(fn: () => Promise<T>): Promise<T> {
  const executeQueued = () => {
    const run = localLockChain.then(fn, fn);
    localLockChain = run.catch(() => {});
    return run;
  };

  if (
    typeof navigator !== "undefined" &&
    "locks" in navigator &&
    navigator.locks &&
    typeof navigator.locks.request === "function"
  ) {
    return navigator.locks.request(
      VAULT_INDEX_WEB_LOCK_NAME,
      { mode: "exclusive" },
      () => executeQueued(),
    ) as Promise<T>;
  }

  return executeQueued();
}
