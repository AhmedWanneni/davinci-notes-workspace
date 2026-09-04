import { create } from "zustand";
import {
  updateGraphForNote,
  updateTagIndexForNote,
  type GraphIndex,
  type TagIndex,
} from "@app/indexer";
import {
  createEditorSettings,
  type EditorSettingsState,
} from "./createEditorSettings";
import {
  createNoteCrudActions,
  type NoteCrudActions,
} from "./createNoteCrudActions";
import { saveTimers } from "./saveTimers";
import {
  readNote,
  writeNote,
  noteFromMarkdown,
  getVaultIndexDb,
  persistNote,
  withVaultWatchSuppressed,
  withDbLock,
} from "../vault";
import {
  flushH1DrivenRename,
  scheduleH1DrivenRename,
} from "../vault/h1DrivenRename";

interface WorkspaceState extends EditorSettingsState, NoteCrudActions {
  activeNotePath: string | null;
  openNotes: string[];
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  allNotePaths: string[];
  allFolderPaths: string[];
  graph: GraphIndex | null;
  tagIndex: TagIndex | null;
  vaultPath: string | null;
  vimModeState: string | null;
  setVimModeState: (mode: string | null) => void;
  syncMode: "off" | "drive" | "folder";
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
  saveNoteNow: (path: string) => Promise<void>;
  saveAllDirty: () => Promise<void>;
  closeAllNotes: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeNotePath: null,
  openNotes: [],
  notesContent: {},
  dirtyNotes: new Set(),
  allNotePaths: [],
  allFolderPaths: [],
  graph: null,
  tagIndex: null,
  vaultPath: null,
  vimModeState: null,
  setVimModeState: (mode) => set({ vimModeState: mode }),
  vaultUpdateCounter: 0,
  syncMode: "off",
  setSyncMode: (mode) => set({ syncMode: mode }),
  ...createEditorSettings(set),
  setVaultPath: (path: string | null) => set({ vaultPath: path }),

  initializeVault: async (
    paths: string[],
    folderPaths: string[],
    initialGraph: GraphIndex | null = null,
    tagIndex: TagIndex | null = null,
  ) => {
    set({
      allNotePaths: paths,
      allFolderPaths: folderPaths,
      openNotes: [],
      notesContent: {},
      dirtyNotes: new Set(),
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
    set({ openNotes: nextOpenNotes });
  },

  closeNote: async (path: string) => {
    if (saveTimers[path]) {
      clearTimeout(saveTimers[path]);
      delete saveTimers[path];
    }
    const effectivePath = await flushH1DrivenRename(path);
    await get().saveNoteNow(effectivePath);

    const { openNotes, activeNotePath, notesContent } = get();
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

    set({
      openNotes: nextOpenNotes,
      activeNotePath: nextActivePath,
      notesContent: nextNotesContent,
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

    if (saveTimers[path]) clearTimeout(saveTimers[path]);
    saveTimers[path] = setTimeout(async () => {
      delete saveTimers[path];
      await get().saveNoteNow(path);
    }, 750);

    scheduleH1DrivenRename(path);
  },

  saveNoteNow: async (path: string) => {
    const { notesContent, dirtyNotes, allNotePaths, graph } = get();
    if (!dirtyNotes.has(path) || notesContent[path] === undefined) return;
    const content = notesContent[path];

    try {
      await withVaultWatchSuppressed(async () => {
        await writeNote(path, content);
      });
    } catch (e) {
      console.error(`Failed to write note: ${path}`, e);
      return;
    }

    try {
      const db = await getVaultIndexDb();
      const note = noteFromMarkdown(path, content, Date.now(), allNotePaths);
      await withDbLock(() => persistNote(db, note));
      if (graph) {
        const nextGraph = updateGraphForNote(graph, note);
        set({
          graph: nextGraph,
          vaultUpdateCounter: get().vaultUpdateCounter + 1,
        });
      }
      if (get().tagIndex) updateTagIndexForNote(get().tagIndex!, note);
    } catch (e) {
      console.error(`Failed to reindex note: ${path}`, e);
    }

    set((state) => {
      const nextDirty = new Set(state.dirtyNotes);
      nextDirty.delete(path);
      return { dirtyNotes: nextDirty };
    });
  },

  saveAllDirty: async () => {
    const { dirtyNotes, openNotes } = get();
    for (const path of openNotes) {
      await flushH1DrivenRename(path);
    }
    for (const path of Array.from(dirtyNotes)) {
      if (saveTimers[path]) {
        clearTimeout(saveTimers[path]);
        delete saveTimers[path];
      }
      await get().saveNoteNow(path);
    }
  },

  closeAllNotes: async () => {
    await get().saveAllDirty();
    set({
      openNotes: [],
      activeNotePath: null,
      notesContent: {},
      dirtyNotes: new Set(),
    });
  },

  ...createNoteCrudActions(),
}));
