import { setVaultWatcherPaused, startVaultWatcher } from "./vaultCommands";
import {
  sleep,
  VAULT_WATCHER_SETTLE_MS,
  vaultWatchCoordinator,
} from "./vaultWatchCoordinator";

/** Pause FS events, run work, flush debouncer, then resume watching. */
export async function withVaultWatchSuppressed<T>(
  work: () => Promise<T>,
): Promise<T> {
  vaultWatchCoordinator.beginSuppression();
  await setVaultWatcherPaused(true);
  try {
    return await work();
  } finally {
    await sleep(VAULT_WATCHER_SETTLE_MS);
    await setVaultWatcherPaused(false);
    vaultWatchCoordinator.endSuppression();
  }
}

/** Start watcher after initial index — never during the read pass. */
export async function activateVaultWatcher(): Promise<void> {
  await setVaultWatcherPaused(true);
  await startVaultWatcher();
  await sleep(VAULT_WATCHER_SETTLE_MS);
  await setVaultWatcherPaused(false);
}
