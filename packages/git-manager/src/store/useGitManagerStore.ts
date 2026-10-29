import { create } from "zustand";
import type { GitFileChange, GitRepoInfo } from "../types/gitTypes";
import { fetchGitRepoInfo, fetchGitStatus, initGitRepository } from "../api/gitClient";
import { parsePorcelainV2 } from "../parsers/parsePorcelainV2";

export interface GitManagerState {
  repoInfo: GitRepoInfo | null;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  untracked: GitFileChange[];
  isLoading: boolean;
  error: string | null;
  isStatusDirty: boolean;
  refreshRepoInfo: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  initializeRepo: () => Promise<void>;
  setStatusDirty: (dirty: boolean) => void;
}

export const useGitManagerStore = create<GitManagerState>((set, get) => ({
  repoInfo: null,
  staged: [],
  unstaged: [],
  conflicts: [],
  untracked: [],
  isLoading: false,
  error: null,
  isStatusDirty: false,

  refreshRepoInfo: async () => {
    try {
      const info = await fetchGitRepoInfo();
      set({ repoInfo: info });
      if (info.isRepo) {
        await get().refreshStatus();
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  refreshStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await fetchGitStatus();
      const parsed = parsePorcelainV2(raw);
      set({
        staged: parsed.staged,
        unstaged: parsed.unstaged,
        conflicts: parsed.conflicts,
        untracked: parsed.untracked,
        isLoading: false,
        isStatusDirty: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  initializeRepo: async () => {
    set({ isLoading: true, error: null });
    try {
      await initGitRepository();
      const info = await fetchGitRepoInfo();
      set({ repoInfo: info });
      await get().refreshStatus();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  setStatusDirty: (dirty: boolean) => set({ isStatusDirty: dirty }),
}));
