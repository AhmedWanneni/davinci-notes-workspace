import {
  setVaultWatcherPaused,
  startVaultWatcher,
  stopVaultWatcher,
} from "./vaultCommands";
import {
  sleep,
  VAULT_WATCHER_SETTLE_MS,
  vaultWatchCoordinator,
} from "./vaultWatchCoordinator";

let vaultMutationLock: Promise<void> = Promise.resolve();

async function runWithVaultWatchSuppressed<T>(
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

/** Serialize vault mutations while the watcher is paused for each mutation. */
export function withVaultWatchSuppressed<T>(
  work: () => Promise<T>,
): Promise<T> {
  const run = vaultMutationLock.then(
    () => runWithVaultWatchSuppressed(work),
    () => runWithVaultWatchSuppressed(work),
  );
  vaultMutationLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Start watcher after initial index — never during the read pass. */
export async function activateVaultWatcher(): Promise<void> {
  await setVaultWatcherPaused(true);
  await startVaultWatcher();
  await sleep(VAULT_WATCHER_SETTLE_MS);
  await setVaultWatcherPaused(false);
}

/** Stop watcher during vault teardown before closing or switching vaults. */
export async function deactivateVaultWatcher(): Promise<void> {
  await setVaultWatcherPaused(true);
  await stopVaultWatcher();
}
