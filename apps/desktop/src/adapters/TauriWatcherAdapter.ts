import type {
  WatcherAdapter,
  WatcherChangeEvent,
  WatcherUnlistenFn,
} from "@app/platform-adapters";
import {
  setVaultWatcherPaused as invokeSetVaultWatcherPaused,
  startVaultWatcher as invokeStartVaultWatcher,
  stopVaultWatcher as invokeStopVaultWatcher,
  subscribeVaultChanges,
  type VaultChangeBatch,
} from "../vault/vaultCommands";

export class TauriWatcherAdapter implements WatcherAdapter {
  async start(
    onChange: (event: WatcherChangeEvent) => void,
  ): Promise<WatcherUnlistenFn> {
    await invokeStartVaultWatcher();

    const unlisten = await subscribeVaultChanges((batch: VaultChangeBatch) => {
      const allChanged = [
        ...batch.changed,
        ...batch.removed,
        ...batch.renamed.map((r) => r.to),
        ...batch.renamed.map((r) => r.from),
      ];
      onChange({ paths: allChanged });
    });

    return unlisten;
  }

  async stop(): Promise<void> {
    await invokeStopVaultWatcher();
  }

  async setPaused(paused: boolean): Promise<void> {
    await invokeSetVaultWatcherPaused(paused);
  }
}
