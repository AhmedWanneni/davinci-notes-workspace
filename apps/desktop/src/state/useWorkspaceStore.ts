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
import {
  createNoteNavigationActions,
  type NoteNavigationActions,
} from "./createNoteNavigationActions";
import { saveTimers } from "./saveTimers";
import { emptyNoteHistory, type NoteHistory } from "./noteHistory";
import { diskStateTracker } from "../vault";
import {
  flushH1DrivenRename,
  scheduleH1DrivenRename,
} from "../vault/h1DrivenRename";
import { notifyNoteEmbedUpdate } from "@app/editor";

export interface WorkspaceState
  extends
    EditorSettingsState,
    NoteCrudActions,
    NoteSaveActions,
    NoteNavigationActions {
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
  updateNoteContent: (path: string, content: string) => void;
  replaceLoadedNoteContent: (path: string, content: string) => void;
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
      isGlobalGraphOpen: false,
      vaultUpdateCounter: get().vaultUpdateCounter + 1,
    });
  },

  updateAllPaths: (paths: string[]) => set({ allNotePaths: paths }),
  updateAllFolderPaths: (paths: string[]) => set({ allFolderPaths: paths }),
  incrementVaultUpdateCounter: () =>
    set((state) => ({ vaultUpdateCounter: state.vaultUpdateCounter + 1 })),

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
    set((state) => ({
      notesContent: { ...state.notesContent, [path]: content },
    }));
  },

  ...createNoteCrudActions(),
  ...createNoteSaveActions(get, set),
  ...createNoteNavigationActions(get, set),
}));
