import type { ListeningSessionState } from "./listeningTypes";

const RECOVERY_STORAGE_KEY = "davinci_active_meeting_recovery";

export function saveActiveMeetingRecovery(
  state: Partial<ListeningSessionState>,
): void {
  try {
    if (typeof localStorage !== "undefined") {
      const payload = JSON.stringify({
        ...state,
        savedAt: Date.now(),
      });
      localStorage.setItem(RECOVERY_STORAGE_KEY, payload);
    }
  } catch {
    // Quota or unavailable storage
  }
}

export function loadActiveMeetingRecovery(): Partial<ListeningSessionState> | null {
  try {
    if (typeof localStorage !== "undefined") {
      const item = localStorage.getItem(RECOVERY_STORAGE_KEY);
      if (!item) return null;
      return JSON.parse(item) as Partial<ListeningSessionState>;
    }
  } catch {
    // Corrupted payload
  }
  return null;
}

export function clearActiveMeetingRecovery(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
  } catch {
    // Ignored
  }
}
