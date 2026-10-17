import type { NetworkBatteryState, SyncPolicyConfig } from "./types";

export const DEFAULT_SYNC_POLICY: SyncPolicyConfig = {
  allowCellularSync: false, // Flagged: Auto-sync on cellular pauses heavy binary uploads to conserve user data
  pauseOnLowBattery: true, // Flagged: Auto-sync pauses below 20% battery or in Low Power Mode to prevent battery drain
  lowBatteryThresholdPercent: 20,
  autoSyncOnForeground: true,
  autoSyncOnSave: true,
  saveDebounceMs: 2000,
};

export interface PolicyCheckResult {
  canSync: boolean;
  reason?: "low-battery" | "offline" | "metered-network" | "disabled";
  allowAttachments: boolean;
}

export function evaluateSyncPolicy(
  state: NetworkBatteryState,
  config: SyncPolicyConfig = DEFAULT_SYNC_POLICY,
  isManualTrigger = false,
): PolicyCheckResult {
  // Manual sync requested by user ALWAYS proceeds regardless of network or battery
  if (isManualTrigger) {
    if (state.networkType === "none") {
      return { canSync: false, reason: "offline", allowAttachments: false };
    }
    return { canSync: true, allowAttachments: true };
  }

  // 1. Offline check
  if (state.networkType === "none") {
    return { canSync: false, reason: "offline", allowAttachments: false };
  }

  // 2. Low Battery check
  if (config.pauseOnLowBattery) {
    if (state.isLowPowerMode) {
      return { canSync: false, reason: "low-battery", allowAttachments: false };
    }
    if (
      state.batteryLevel >= 0 &&
      state.batteryLevel * 100 <= config.lowBatteryThresholdPercent
    ) {
      return { canSync: false, reason: "low-battery", allowAttachments: false };
    }
  }

  // 3. Metered network check (cellular)
  if (state.isMetered || state.networkType === "cellular") {
    if (!config.allowCellularSync) {
      // Auto-sync allows lightweight markdown notes, but pauses large binary attachments
      return {
        canSync: true,
        allowAttachments: false,
        reason: "metered-network",
      };
    }
  }

  return { canSync: true, allowAttachments: true };
}
