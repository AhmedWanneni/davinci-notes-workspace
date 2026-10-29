import { create } from "zustand";
import type {
  GitCommitDetail,
  GitCommitEntry,
  GitFileChange,
  GitFileDiff,
  GitGraphNode,
  GitRepoInfo,
} from "../types/gitTypes";
import {
  fetchGitRepoInfo,
  fetchGitStatus,
  initGitRepository,
  stageGitPaths,
  unstageGitPaths,
  discardGitPaths,
  commitGit,
  fetchFileDiff,
  applyGitPatch,
  fetchGitLog,
  fetchGitCommitDetails,
} from "../api/gitClient";
import { parsePorcelainV2 } from "../parsers/parsePorcelainV2";
import { calculateGraphLanes } from "../graph/calculateGraphLanes";

export interface GitManagerState {
  repoInfo: GitRepoInfo | null;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  untracked: GitFileChange[];
  activeDiff: GitFileDiff | null;
  commits: GitCommitEntry[];
  graphNodes: GitGraphNode[];
  activeCommitDetail: GitCommitDetail | null;
  viewMode: "changes" | "history";
  isLoading: boolean;
  error: string | null;
  isStatusDirty: boolean;
  setViewMode: (mode: "changes" | "history") => void;
  refreshRepoInfo: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  initializeRepo: () => Promise<void>;
  stagePaths: (paths: string[]) => Promise<void>;
  unstagePaths: (paths: string[]) => Promise<void>;
  discardPaths: (paths: string[]) => Promise<void>;
  commit: (message: string, amend?: boolean) => Promise<string | undefined>;
  openDiff: (path: string, staged: boolean) => Promise<void>;
  closeDiff: () => void;
  stageHunk: (patch: string) => Promise<void>;
  unstageHunk: (patch: string) => Promise<void>;
  fetchHistory: (limit?: number, skip?: number, pathFilter?: string) => Promise<void>;
  openCommitDetail: (hash: string) => Promise<void>;
  closeCommitDetail: () => void;
  setStatusDirty: (dirty: boolean) => void;
}

const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const useGitManagerStore = create<GitManagerState>((set, get) => ({
  repoInfo: null,
  staged: [],
  unstaged: [],
  conflicts: [],
  untracked: [],
  activeDiff: null,
  commits: [],
  graphNodes: [],
  activeCommitDetail: null,
  viewMode: "changes",
  isLoading: false,
  error: null,
  isStatusDirty: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  refreshRepoInfo: async () => {
    try {
      const info = await fetchGitRepoInfo();
      set({ repoInfo: info });
      if (info.isRepo) await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err) });
    }
  },

  refreshStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await fetchGitStatus();
      const p = parsePorcelainV2(raw);
      set({
        staged: p.staged,
        unstaged: p.unstaged,
        conflicts: p.conflicts,
        untracked: p.untracked,
        isLoading: false,
        isStatusDirty: false,
      });
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
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
      set({ error: errMsg(err), isLoading: false });
    }
  },

  stagePaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await stageGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  unstagePaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await unstageGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  discardPaths: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await discardGitPaths(paths);
      await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
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
      set({ error: errMsg(err), isLoading: false });
      return undefined;
    }
  },

  openDiff: async (path: string, staged: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const diff = await fetchFileDiff(path, staged);
      set({ activeDiff: diff, isLoading: false });
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  closeDiff: () => set({ activeDiff: null }),

  stageHunk: async (patch: string) => {
    set({ isLoading: true, error: null });
    try {
      await applyGitPatch(patch, true, false);
      const active = get().activeDiff;
      if (active) await get().openDiff(active.path, active.staged);
      await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  unstageHunk: async (patch: string) => {
    set({ isLoading: true, error: null });
    try {
      await applyGitPatch(patch, true, true);
      const active = get().activeDiff;
      if (active) await get().openDiff(active.path, active.staged);
      await get().refreshStatus();
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  fetchHistory: async (limit = 100, skip = 0, pathFilter?: string) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await fetchGitLog(limit, skip, pathFilter);
      const nodes = calculateGraphLanes(entries);
      set({ commits: entries, graphNodes: nodes, isLoading: false });
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  openCommitDetail: async (hash: string) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await fetchGitCommitDetails(hash);
      set({ activeCommitDetail: detail, isLoading: false });
    } catch (err) {
      set({ error: errMsg(err), isLoading: false });
    }
  },

  closeCommitDetail: () => set({ activeCommitDetail: null }),
  setStatusDirty: (dirty: boolean) => set({ isStatusDirty: dirty }),
}));
