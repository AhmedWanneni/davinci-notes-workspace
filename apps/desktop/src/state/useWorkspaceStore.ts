import { create } from "zustand";
import type { GraphIndex, TagIndex } from "@app/indexer";
import {
  createEditorSettings,
  type EditorSettingsState,
} from "./createEditorSettings";
import {
  createNoteCrudActions,
  type NoteCrudActions,
} from "./createNoteCrudActions";
import {
  createNoteSaveActions,
  type NoteSaveActions,
} from "./createNoteSaveActions";
import { saveTimers } from "./saveTimers";
import {
  emptyNoteHistory,
  moveNoteHistory,
  pushNoteHistory,
  type NoteHistory,
} from "./noteHistory";
import { readNote, diskStateTracker } from "../vault";
import {
  flushH1DrivenRename,
  scheduleH1DrivenRename,
} from "../vault/h1DrivenRename";
import { notifyNoteEmbedUpdate } from "@app/editor";

export interface WorkspaceState
  extends EditorSettingsState, NoteCrudActions, NoteSaveActions {
  activeNotePath: string | null;
  openNotes: string[];
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  conflictNotes: Map<string, string>;
  allNotePaths: string[];
  allFolderPaths: string[];
  graph: GraphIndex | null;
  tagIndex: TagIndex | null;
  vaultPath: string | null;
  vimModeState: string | null;
  setVimModeState: (mode: string | null) => void;
  syncMode: "off" | "drive" | "folder";
  noteHistory: NoteHistory;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  setSyncMode: (mode: "off" | "drive" | "folder") => void;
  setVaultPath: (path: string | null) => void;
  initializeVault: (
    paths: string[],
    folderPaths: string[],
    initialGraph?: GraphIndex | null,
    tagIndex?: TagIndex | null,
  ) => Promise<void>;
  updateAllPaths: (paths: string[]) => void;
  updateAllFolderPaths: (paths: string[]) => void;
  incrementVaultUpdateCounter: () => void;
  openNote: (path: string) => Promise<void>;
  closeNote: (path: string) => Promise<void>;
  setActiveNote: (path: string) => Promise<void>;
  updateNoteContent: (path: string, content: string) => void;
  replaceLoadedNoteContent: (path: string, content: string) => void;
  closeAllNotes: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeNotePath: null,
  openNotes: [],
  notesContent: {},
  dirtyNotes: new Set(),
  conflictNotes: new Map(),
  allNotePaths: [],
  allFolderPaths: [],
  graph: null,
  tagIndex: null,
  vaultPath: null,
  vimModeState: null,
  setVimModeState: (mode) => set({ vimModeState: mode }),
  vaultUpdateCounter: 0,
  syncMode: "off",
  noteHistory: emptyNoteHistory,
  setSyncMode: (mode) => set({ syncMode: mode }),
  ...createEditorSettings(set),
  setVaultPath: (path: string | null) => set({ vaultPath: path }),

  initializeVault: async (
    paths: string[],
    folderPaths: string[],
    initialGraph: GraphIndex | null = null,
    tagIndex: TagIndex | null = null,
  ) => {
    diskStateTracker.clear();
    set({
      allNotePaths: paths,
      allFolderPaths: folderPaths,
      openNotes: [],
      notesContent: {},
      dirtyNotes: new Set(),
      conflictNotes: new Map(),
      activeNotePath: null,
      graph: initialGraph,
      tagIndex,
      vaultUpdateCounter: get().vaultUpdateCounter + 1,
    });
  },

  updateAllPaths: (paths: string[]) => set({ allNotePaths: paths }),
  updateAllFolderPaths: (paths: string[]) => set({ allFolderPaths: paths }),
  incrementVaultUpdateCounter: () =>
    set((state) => ({ vaultUpdateCounter: state.vaultUpdateCounter + 1 })),

  openNote: async (path: string) => {
    const { notesContent, openNotes } = get();
    if (notesContent[path] === undefined) {
      try {
        const file = await readNote(path);
        diskStateTracker.set(path, {
          mtime: file.mtime,
          size: file.size,
          content: file.content,
        });
        set((state) => ({
          notesContent: { ...state.notesContent, [path]: file.content },
        }));
      } catch (e) {
        console.error(`Failed to open note: ${path}`, e);
        return;
      }
    }
    const nextOpenNotes = openNotes.includes(path)
      ? openNotes
      : [...openNotes, path];
    await get().setActiveNote(path);
    set((state) => ({
      openNotes: nextOpenNotes,
      noteHistory: pushNoteHistory(state.noteHistory, path),
    }));
  },

  goBack: async () => {
    const next = moveNoteHistory(get().noteHistory, -1);
    const path = next.paths[next.index];
    if (!path || !get().allNotePaths.includes(path)) return;
    set({ noteHistory: next });
    await get().openNote(path);
    set({ noteHistory: next });
  },
  goForward: async () => {
    const next = moveNoteHistory(get().noteHistory, 1);
    const path = next.paths[next.index];
    if (!path || !get().allNotePaths.includes(path)) return;
    set({ noteHistory: next });
    await get().openNote(path);
    set({ noteHistory: next });
  },

  closeNote: async (path: string) => {
    if (saveTimers[path]) {
      clearTimeout(saveTimers[path]);
      delete saveTimers[path];
    }
    const effectivePath = await flushH1DrivenRename(path);
    await get().saveNoteNow(effectivePath);

    const { openNotes, activeNotePath, notesContent, conflictNotes } = get();
    const nextOpenNotes = openNotes.filter((p) => p !== effectivePath);
    let nextActivePath = activeNotePath;
    if (activeNotePath === effectivePath) {
      nextActivePath =
        nextOpenNotes.length > 0
          ? nextOpenNotes[nextOpenNotes.length - 1]
          : null;
    }

    const nextNotesContent = { ...notesContent };
    delete nextNotesContent[effectivePath];
    const nextConflict = new Map(conflictNotes);
    nextConflict.delete(effectivePath);
    diskStateTracker.remove(effectivePath);

    set({
      openNotes: nextOpenNotes,
      activeNotePath: nextActivePath,
      notesContent: nextNotesContent,
      conflictNotes: nextConflict,
    });
  },

  setActiveNote: async (path: string) => {
    const { activeNotePath, dirtyNotes } = get();
    if (activeNotePath && activeNotePath !== path) {
      if (saveTimers[activeNotePath]) {
        clearTimeout(saveTimers[activeNotePath]);
        delete saveTimers[activeNotePath];
      }
      const effectivePath = await flushH1DrivenRename(activeNotePath);
      if (dirtyNotes.has(effectivePath) || dirtyNotes.has(activeNotePath)) {
        await get().saveNoteNow(effectivePath);
      }
    }
    set({ activeNotePath: path });
  },

  updateNoteContent: (path: string, content: string) => {
    set((state) => {
      const nextDirty = new Set(state.dirtyNotes);
      nextDirty.add(path);
      return {
        notesContent: { ...state.notesContent, [path]: content },
        dirtyNotes: nextDirty,
      };
    });
    notifyNoteEmbedUpdate(path, content);

    if (saveTimers[path]) clearTimeout(saveTimers[path]);
    saveTimers[path] = setTimeout(async () => {
      delete saveTimers[path];
      const effectivePath = await flushH1DrivenRename(path);
      await get().saveNoteNow(effectivePath);
    }, 750);

    scheduleH1DrivenRename(path);
  },

  replaceLoadedNoteContent: (path: string, content: string) => {
    notifyNoteEmbedUpdate(path, content);
    set((state) => ({ notesContent: { ...state.notesContent, [path]: content } }));
  },

  closeAllNotes: async () => {
    await get().saveAllDirty();
    diskStateTracker.clear();
    set({
      openNotes: [],
      activeNotePath: null,
      notesContent: {},
      dirtyNotes: new Set(),
      conflictNotes: new Map(),
    });
  },

  ...createNoteCrudActions(),
  ...createNoteSaveActions(get, set),
}));
