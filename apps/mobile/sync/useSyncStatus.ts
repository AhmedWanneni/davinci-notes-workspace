import { useCallback, useEffect, useState } from "react";
import type { MobileSyncEngine } from "./mobileSyncEngine";
import { defaultSecureTokenStore } from "./secureTokenStore";
import { loginWithDriveNativeSession } from "./mobileDriveAuth";
import type {
  SyncConflictInfo,
  SyncPassResult,
  SyncProgress,
  SyncStatus,
} from "./types";

export interface SyncStatusState {
  status: SyncStatus;
  progress: SyncProgress;
  lastSyncedAt: number | null;
  pendingChangesCount: number;
  conflicts: SyncConflictInfo[];
  errorMessage: string | null;
  isAuthenticated: boolean;
  refreshPendingChanges: () => Promise<number>;
  syncNow: () => Promise<SyncPassResult>;
  connectDrive: (clientId: string) => Promise<void>;
  disconnectDrive: () => Promise<void>;
}

export function useSyncStatus(engine?: MobileSyncEngine): SyncStatusState {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [progress, setProgress] = useState<SyncProgress>({
    phase: "idle",
    current: 0,
    total: 0,
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflictInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const refreshPendingChanges = useCallback(async (): Promise<number> => {
    if (!engine) return 0;
    try {
      const pending = await engine.getPendingChanges();
      setPendingChangesCount(pending.pendingCount);
      return pending.pendingCount;
    } catch {
      return 0;
    }
  }, [engine]);

  useEffect(() => {
    defaultSecureTokenStore.load().then((token) => {
      setIsAuthenticated(Boolean(token?.accessToken));
    });
    refreshPendingChanges();
  }, [refreshPendingChanges]);

  const syncNow = useCallback(async (): Promise<SyncPassResult> => {
    if (!engine) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: "No sync engine configured",
      };
    }

    setStatus("syncing");
    setProgress({ phase: "diffing", current: 0, total: 1 });
    setErrorMessage(null);

    const res = await engine.runSyncPass({ isManual: true });
    setProgress({ phase: "complete", current: 1, total: 1 });
    if (res.pendingChangesCount !== undefined) {
      setPendingChangesCount(res.pendingChangesCount);
    }

    if (res.success) {
      if (res.conflicts.length > 0) {
        setStatus("conflict");
        setConflicts(res.conflicts);
      } else {
        setStatus("idle");
        setConflicts([]);
      }
      setLastSyncedAt(Date.now());
    } else {
      if (res.interrupted) {
        setStatus("interrupted");
      } else if (res.policyReason?.includes("battery")) {
        setStatus("paused-low-battery");
      } else if (
        res.policyReason?.includes("metered") ||
        res.policyReason?.includes("cellular")
      ) {
        setStatus("paused-metered");
      } else if (res.reauthRequired) {
        setStatus("reauth-required");
        setIsAuthenticated(false);
      } else {
        setStatus("error");
      }
      setErrorMessage(res.error ?? "Sync failed");
    }

    return res;
  }, [engine]);

  const connectDrive = useCallback(
    async (clientId: string) => {
      try {
        setStatus("syncing");
        setErrorMessage(null);
        await loginWithDriveNativeSession(clientId);
        setIsAuthenticated(true);
        setStatus("idle");
        await refreshPendingChanges();
      } catch (err) {
        setStatus("error");
        setErrorMessage(String(err));
      }
    },
    [refreshPendingChanges],
  );

  const disconnectDrive = useCallback(async () => {
    await defaultSecureTokenStore.clear();
    setIsAuthenticated(false);
    setStatus("idle");
    setConflicts([]);
    setErrorMessage(null);
  }, []);

  return {
    status,
    progress,
    lastSyncedAt,
    pendingChangesCount,
    conflicts,
    errorMessage,
    isAuthenticated,
    refreshPendingChanges,
    syncNow,
    connectDrive,
    disconnectDrive,
  };
}
