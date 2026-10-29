import { create } from "zustand";
import type { GitRemoteInfo, GitTrackingStatus } from "../types/gitTypes";
import {
  fetchGitRemote,
  getGitRemotes,
  getGitTrackingStatus,
  pullGitRemote,
  pushGitRemote,
} from "../api/gitClient";

export interface GitSyncState {
  tracking: GitTrackingStatus | null;
  remotes: GitRemoteInfo[];
  isSyncing: boolean;
  syncError: string | null;
  syncMessage: string | null;
  refreshTracking: () => Promise<void>;
  refreshRemotes: () => Promise<void>;
  fetch: (remote?: string) => Promise<void>;
  pull: (remote?: string) => Promise<void>;
  push: (remote?: string, branch?: string, force?: boolean) => Promise<void>;
  clearSyncMessage: () => void;
}

const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const useGitSyncStore = create<GitSyncState>((set, get) => ({
  tracking: null,
  remotes: [],
  isSyncing: false,
  syncError: null,
  syncMessage: null,

  clearSyncMessage: () => set({ syncError: null, syncMessage: null }),

  refreshTracking: async () => {
    try {
      const tracking = await getGitTrackingStatus();
      set({ tracking });
    } catch (err) {
      set({ syncError: errMsg(err) });
    }
  },

  refreshRemotes: async () => {
    try {
      const remotes = await getGitRemotes();
      set({ remotes });
    } catch (err) {
      set({ syncError: errMsg(err) });
    }
  },

  fetch: async (remote?: string) => {
    set({ isSyncing: true, syncError: null });
    try {
      const res = await fetchGitRemote(remote);
      set({ isSyncing: false, syncMessage: res.message });
      await get().refreshTracking();
    } catch (err) {
      set({ isSyncing: false, syncError: errMsg(err) });
    }
  },

  pull: async (remote?: string) => {
    set({ isSyncing: true, syncError: null });
    try {
      const res = await pullGitRemote(remote);
      set({ isSyncing: false, syncMessage: res.message });
      await get().refreshTracking();
    } catch (err) {
      set({ isSyncing: false, syncError: errMsg(err) });
    }
  },

  push: async (remote?: string, branch?: string, force?: boolean) => {
    set({ isSyncing: true, syncError: null });
    try {
      const res = await pushGitRemote(remote, branch, force);
      set({ isSyncing: false, syncMessage: res.message });
      await get().refreshTracking();
    } catch (err) {
      set({ isSyncing: false, syncError: errMsg(err) });
    }
  },
}));
