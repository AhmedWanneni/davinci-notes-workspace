import { create } from "zustand";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  fetchDriveAccountEmail,
  getDriveAccessToken,
  openDriveAuthorizationUrl,
  signInToDrive,
  signOutOfDrive,
} from "./desktopDriveAuth";

export interface DriveSyncState {
  isDriveSignedIn: boolean;
  driveAccountEmail: string | null;
  isSyncing: boolean;
  isDriveSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  checkAuthStatus: () => Promise<void>;
  syncNow: () => Promise<boolean>;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearSyncError: () => void;
}

export const useDriveSyncStore = create<DriveSyncState>((set, get) => ({
  isDriveSignedIn: false,
  driveAccountEmail: null,
  isSyncing: false,
  isDriveSyncing: false,
  lastSyncedAt: null,
  syncError: null,

  clearSyncError: () => set({ syncError: null }),

  checkAuthStatus: async () => {
    try {
      const token = await getDriveAccessToken();
      const email = await fetchDriveAccountEmail(token);
      set({ isDriveSignedIn: true, driveAccountEmail: email, syncError: null });
    } catch {
      set({ isDriveSignedIn: false, driveAccountEmail: null });
    }
  },

  syncNow: async () => {
    if (get().isSyncing) return false;
    const vaultPath = useWorkspaceStore.getState().vaultPath;
    if (!vaultPath) {
      set({
        isSyncing: false,
        isDriveSyncing: false,
        syncError: "Please open a vault first to sync notes.",
      });
      return false;
    }

    set({ isSyncing: true, isDriveSyncing: true, syncError: null });
    try {
      const { runDesktopDriveSync } = await import("./desktopSyncEngine");
      const res = await runDesktopDriveSync();
      if (res.success) {
        set({
          isSyncing: false,
          isDriveSyncing: false,
          lastSyncedAt: Date.now(),
          syncError: null,
        });
        return true;
      }
      if (res.reauthRequired) {
        set({
          isDriveSignedIn: false,
          isSyncing: false,
          isDriveSyncing: false,
          syncError: "Drive session expired. Please sign in again.",
        });
        return false;
      }
      set({
        isSyncing: false,
        isDriveSyncing: false,
        syncError: res.error ?? "Sync failed",
      });
      return false;
    } catch (err) {
      set({
        isSyncing: false,
        isDriveSyncing: false,
        syncError: err instanceof Error ? err.message : "Sync failed",
      });
      return false;
    }
  },

  signIn: async () => {
    set({ isSyncing: true, isDriveSyncing: true, syncError: null });
    try {
      const token = await signInToDrive(openDriveAuthorizationUrl);
      const email = await fetchDriveAccountEmail(token.accessToken);
      set({
        isDriveSignedIn: true,
        driveAccountEmail: email,
        isSyncing: false,
        isDriveSyncing: false,
        syncError: null,
      });

      const vaultPath = useWorkspaceStore.getState().vaultPath;
      if (vaultPath) {
        void get().syncNow();
      }
      return true;
    } catch (err) {
      console.error("[drive-sync] Sign in error:", err);
      set({
        isDriveSignedIn: false,
        isSyncing: false,
        isDriveSyncing: false,
        syncError: err instanceof Error ? err.message : "Sign-in failed",
      });
      return false;
    }
  },

  signOut: async () => {
    await signOutOfDrive();
    set({
      isDriveSignedIn: false,
      driveAccountEmail: null,
      isSyncing: false,
      isDriveSyncing: false,
      syncError: null,
    });
  },
}));
