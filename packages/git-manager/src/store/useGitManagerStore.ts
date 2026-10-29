import { create } from "zustand";
import type { GitRepoInfo } from "../types/gitTypes";
import { fetchGitRepoInfo, initGitRepository } from "../api/gitClient";

export interface GitManagerState {
  repoInfo: GitRepoInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshRepoInfo: () => Promise<void>;
  initializeRepo: () => Promise<void>;
}

export const useGitManagerStore = create<GitManagerState>((set) => ({
  repoInfo: null,
  isLoading: false,
  error: null,

  refreshRepoInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await fetchGitRepoInfo();
      set({ repoInfo: info, isLoading: false });
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
      set({ repoInfo: info, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },
}));
