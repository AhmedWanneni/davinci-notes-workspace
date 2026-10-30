import { create } from "zustand";
import type { GitConflictFileVersions } from "../types/gitTypes";
import {
  abortGitMerge,
  continueGitMerge,
  getGitConflictDetails,
  resolveGitConflict,
} from "../api/gitClient";

export interface GitConflictState {
  activeConflict: GitConflictFileVersions | null;
  activeResult: string;
  isResolving: boolean;
  conflictError: string | null;
  openConflict: (path: string) => Promise<void>;
  closeConflict: () => void;
  setResult: (content: string) => void;
  acceptOurs: () => void;
  acceptTheirs: () => void;
  acceptBoth: () => void;
  resolveConflict: () => Promise<void>;
  abortCurrentMerge: () => Promise<void>;
  continueCurrentMerge: () => Promise<string | undefined>;
}

const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const useGitConflictStore = create<GitConflictState>((set, get) => ({
  activeConflict: null,
  activeResult: "",
  isResolving: false,
  conflictError: null,

  openConflict: async (path: string) => {
    set({ isResolving: true, conflictError: null });
    try {
      const details = await getGitConflictDetails(path);
      set({
        activeConflict: details,
        activeResult: details.current,
        isResolving: false,
      });
    } catch (err) {
      set({ conflictError: errMsg(err), isResolving: false });
    }
  },

  closeConflict: () => set({ activeConflict: null, activeResult: "", conflictError: null }),

  setResult: (content: string) => set({ activeResult: content }),

  acceptOurs: () => {
    const { activeConflict } = get();
    if (activeConflict?.ours != null) {
      set({ activeResult: activeConflict.ours });
    }
  },

  acceptTheirs: () => {
    const { activeConflict } = get();
    if (activeConflict?.theirs != null) {
      set({ activeResult: activeConflict.theirs });
    }
  },

  acceptBoth: () => {
    const { activeConflict } = get();
    const ours = activeConflict?.ours ?? "";
    const theirs = activeConflict?.theirs ?? "";
    const combined = `${ours}\n${theirs}`.trim();
    set({ activeResult: combined });
  },

  resolveConflict: async () => {
    const { activeConflict, activeResult } = get();
    if (!activeConflict) return;
    set({ isResolving: true, conflictError: null });
    try {
      await resolveGitConflict(activeConflict.path, activeResult);
      set({ activeConflict: null, activeResult: "", isResolving: false });
    } catch (err) {
      set({ conflictError: errMsg(err), isResolving: false });
    }
  },

  abortCurrentMerge: async () => {
    set({ isResolving: true, conflictError: null });
    try {
      await abortGitMerge();
      set({ activeConflict: null, activeResult: "", isResolving: false });
    } catch (err) {
      set({ conflictError: errMsg(err), isResolving: false });
    }
  },

  continueCurrentMerge: async () => {
    set({ isResolving: true, conflictError: null });
    try {
      const hash = await continueGitMerge();
      set({ activeConflict: null, activeResult: "", isResolving: false });
      return hash;
    } catch (err) {
      set({ conflictError: errMsg(err), isResolving: false });
      return undefined;
    }
  },
}));
