/** Matches Rust `watcher::DEBOUNCE_MS` + small buffer for debounced flush. */
export const VAULT_WATCHER_SETTLE_MS = 450;

/** Drop watcher batches while the app is indexing or reconciling. */
export class VaultWatchCoordinator {
  private depth = 0;

  beginSuppression(): void {
    this.depth += 1;
  }

  endSuppression(): void {
    this.depth = Math.max(0, this.depth - 1);
  }

  shouldProcessBatch(): boolean {
    return this.depth === 0;
  }

  get suppressionDepth(): number {
    return this.depth;
  }
}

export const vaultWatchCoordinator = new VaultWatchCoordinator();

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
