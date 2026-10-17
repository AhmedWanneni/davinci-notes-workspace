import { AppState, type AppStateStatus } from "react-native";
import type { MobileSyncEngine } from "./mobileSyncEngine";
import type {
  NetworkBatteryState,
  SyncPassResult,
  SyncPolicyConfig,
} from "./types";
import { DEFAULT_SYNC_POLICY } from "./syncPolicy";
import { BackgroundSyncCoordinator } from "./backgroundSyncCoordinator";

export class SyncTriggerManager {
  private saveTimeout: NodeJS.Timeout | number | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private isSyncing = false;
  private readonly coordinator: BackgroundSyncCoordinator;

  constructor(
    private readonly engine: MobileSyncEngine,
    private readonly config: SyncPolicyConfig = DEFAULT_SYNC_POLICY,
    private readonly getNetworkState?: () => NetworkBatteryState,
    private readonly onSyncComplete?: (result: SyncPassResult) => void,
    coordinator?: BackgroundSyncCoordinator,
  ) {
    this.coordinator =
      coordinator ??
      new BackgroundSyncCoordinator(this.engine, {
        getNetworkState: this.getNetworkState,
      });
  }

  getBackgroundCoordinator(): BackgroundSyncCoordinator {
    return this.coordinator;
  }

  start(): void {
    this.coordinator.register();

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          this.coordinator.cancelActive();
          if (this.config.autoSyncOnForeground) {
            this.triggerForegroundSync().catch(() => {});
          }
        } else if (nextState === "background" || nextState === "inactive") {
          this.handleAppBackground();
        }
      },
    );
  }

  stop(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.coordinator.unregister();
  }

  async triggerManualSync(): Promise<SyncPassResult> {
    return this.executeSync(true);
  }

  async triggerForegroundSync(): Promise<SyncPassResult> {
    if (!this.config.autoSyncOnForeground) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: "Foreground sync disabled",
      };
    }
    return this.executeSync(false);
  }

  triggerSaveSync(): void {
    if (!this.config.autoSyncOnSave) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.executeSync(false).catch(() => {});
    }, this.config.saveDebounceMs);
  }

  private handleAppBackground(): void {
    // Flush debounced save immediately if queued
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // Execute background sync task with strict timeout cancellation
    this.coordinator
      .executeBackgroundSync()
      .then((res) => {
        if (res.result) {
          this.onSyncComplete?.(res.result);
        }
      })
      .catch(() => {});
  }

  private async executeSync(isManual: boolean): Promise<SyncPassResult> {
    if (this.isSyncing) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: "Sync already in progress",
      };
    }
    this.isSyncing = true;

    try {
      const netState = this.getNetworkState?.();
      const result = await this.engine.runSyncPass({
        isManual,
        networkState: netState,
      });
      this.onSyncComplete?.(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }
}
