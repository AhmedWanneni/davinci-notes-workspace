import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import { diffVaultStats, type ReconcileStats } from "./vaultReconciler";
import type { VaultChangeBatch } from "./types";

export interface UseVaultForegroundSyncOptions {
  adapter: MobileVaultStorageAdapter | null;
  onChangesDetected?: (changes: VaultChangeBatch) => void;
  enabled?: boolean;
}

export function useVaultForegroundSync({
  adapter,
  onChangesDetected,
  enabled = true,
}: UseVaultForegroundSyncOptions): void {
  const previousStatsRef = useRef<ReconcileStats>({});
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!adapter || !enabled) return;

    // Initial baseline scan
    let isCancelled = false;
    adapter
      .scanVault()
      .then((scan) => {
        if (!isCancelled) {
          previousStatsRef.current = scan.stats;
        }
      })
      .catch(() => {});

    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        const isComingToForeground =
          (appStateRef.current === "background" ||
            appStateRef.current === "inactive") &&
          nextState === "active";

        appStateRef.current = nextState;

        if (!isComingToForeground) return;

        try {
          const scan = await adapter.scanVault();
          const diff = diffVaultStats(previousStatsRef.current, scan.stats);
          previousStatsRef.current = scan.stats;

          const hasChanges =
            diff.added.length > 0 ||
            diff.changed.length > 0 ||
            diff.removed.length > 0 ||
            diff.renamed.length > 0;

          if (hasChanges && onChangesDetected) {
            onChangesDetected(diff);
          }
        } catch {
          // Vault might be temporarily inaccessible or detached
        }
      },
    );

    return () => {
      isCancelled = true;
      subscription.remove();
    };
  }, [adapter, enabled, onChangesDetected]);
}
