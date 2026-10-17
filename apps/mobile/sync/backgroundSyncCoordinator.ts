import type { MobileSyncEngine } from "./mobileSyncEngine";
import type { NetworkBatteryState, SyncPassResult } from "./types";

export const BACKGROUND_SYNC_TASK_NAME = "DAVINCI_BACKGROUND_SYNC_TASK";

export interface BackgroundSyncOptions {
  timeoutMs?: number; // Safe timeout before OS kill (e.g. 25s for iOS 30s budget)
  getNetworkState?: () => NetworkBatteryState;
}

export interface BackgroundExecutionResult {
  completed: boolean;
  interrupted: boolean;
  result?: SyncPassResult;
  error?: string;
}

/**
 * Coordinates safe background sync execution with timeout cancellation
 * to conform to iOS and Android background execution budgets.
 */
export class BackgroundSyncCoordinator {
  private activeAbortController: AbortController | null = null;
  private isRegistered = false;

  constructor(
    private readonly engine: MobileSyncEngine,
    private readonly options: BackgroundSyncOptions = {},
  ) {}

  /**
   * Registers background task handler with the system.
   */
  register(): boolean {
    this.isRegistered = true;
    return true;
  }

  unregister(): void {
    this.cancelActive();
    this.isRegistered = false;
  }

  get isTaskRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Safely cancels any active in-flight sync operation.
   */
  cancelActive(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  /**
   * Executes a background sync pass bounded by a strict cancellation timeout.
   */
  async executeBackgroundSync(): Promise<BackgroundExecutionResult> {
    this.cancelActive();
    const abortController = new AbortController();
    this.activeAbortController = abortController;

    const timeoutMs = this.options.timeoutMs ?? 25000;
    let timerId: NodeJS.Timeout | number | null = null;

    const timeoutPromise = new Promise<BackgroundExecutionResult>((resolve) => {
      timerId = setTimeout(() => {
        abortController.abort();
        resolve({
          completed: false,
          interrupted: true,
          error: `Background execution timed out after ${timeoutMs}ms`,
        });
      }, timeoutMs);
    });

    const syncPromise = (async (): Promise<BackgroundExecutionResult> => {
      try {
        const netState = this.options.getNetworkState?.();
        const result = await this.engine.runSyncPass({
          isManual: false,
          networkState: netState,
          abortSignal: abortController.signal,
        });

        if (result.interrupted) {
          return {
            completed: false,
            interrupted: true,
            result,
            error: result.error,
          };
        }

        return { completed: result.success, interrupted: false, result };
      } catch (err) {
        return { completed: false, interrupted: false, error: String(err) };
      } finally {
        if (timerId) clearTimeout(timerId);
        if (this.activeAbortController === abortController) {
          this.activeAbortController = null;
        }
      }
    })();

    return Promise.race([syncPromise, timeoutPromise]);
  }
}
