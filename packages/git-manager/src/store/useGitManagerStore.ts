import { create } from "zustand";
import type { GitFileChange, GitRepoInfo } from "../types/gitTypes";
import {
  fetchGitRepoInfo,
  fetchGitStatus,
  initGitRepository,
  stageGitPaths,
  unstageGitPaths,
  discardGitPaths,
  commitGit,
} from "../api/gitClient";
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
  stagePaths: (paths: string[]) => Promise<void>;
  unstagePaths: (paths: string[]) => Promise<void>;
  discardPaths: (paths: string[]) => Promise<void>;
  commit: (message: string, amend?: boolean) => Promise<string | undefined>;
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

  stagePaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await stageGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  unstagePaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await unstageGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  discardPaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await discardGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  commit: async (message: string, amend = false) => {
    set({ isLoading: true, error: null });
    try {
      const hash = await commitGit(message, amend);
      await get().refreshRepoInfo();
      await get().refreshStatus();
      return hash;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
      return undefined;
    }
  },

  setStatusDirty: (dirty: boolean) => set({ isStatusDirty: dirty }),
}));
