import { create } from "zustand";
import { updateGraphForNote, type GraphIndex } from "@app/indexer";
import { withDbLock } from "../vault/sqliteIndex";
import {
  readNote,
  writeNote,
  noteFromMarkdown,
  getVaultIndexDb,
  persistNote,
  withVaultWatchSuppressed,
  getSetting,
  setSetting,
  renameNoteInVault,
  renameFolderInVault,
} from "../vault";
import {
  flushH1DrivenRename,
  scheduleH1DrivenRename,
} from "../vault/h1DrivenRename";
import { buildNotePathInFolder } from "../vault/sanitizeFilenameStem";

interface WorkspaceState {
  activeNotePath: string | null;
  openNotes: string[];
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  allNotePaths: string[];
  allFolderPaths: string[];
  graph: GraphIndex | null;
  vaultPath: string | null;
  vaultUpdateCounter: number;
  setVaultPath: (path: string | null) => void;
  initializeVault: (
    paths: string[],
    folderPaths: string[],
    initialGraph?: GraphIndex | null,
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
  renameNoteFromTree: (oldPath: string, newStem: string) => Promise<boolean>;
  renameFolderFromTree: (
    oldPath: string,
    newName: string,
  ) => Promise<boolean>;
  editorFont: string;
  loadSettings: () => Promise<void>;
  setEditorFont: (font: string) => Promise<void>;
}

const saveTimers: Record<string, NodeJS.Timeout> = {};

export function migrateSaveTimer(oldPath: string, newPath: string): void {
  if (!saveTimers[oldPath]) {
    return;
  }
  saveTimers[newPath] = saveTimers[oldPath];
  delete saveTimers[oldPath];
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeNotePath: null,
  openNotes: [],
  notesContent: {},
  dirtyNotes: new Set(),
  allNotePaths: [],
  allFolderPaths: [],
  graph: null,
  vaultPath: null,
  vaultUpdateCounter: 0,
  editorFont: "system",
  setVaultPath: (path: string | null) => set({ vaultPath: path }),

  loadSettings: async () => {
    try {
      const db = await getVaultIndexDb();
      const font = await withDbLock(() => getSetting(db, "editorFont"));
      if (font) set({ editorFont: font });
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  },

  setEditorFont: async (font: string) => {
    set({ editorFont: font });
    try {
      const db = await getVaultIndexDb();
      await setSetting(db, "editorFont", font);
    } catch (e) {
      console.error("Failed to save editorFont setting", e);
    }
  },

  initializeVault: async (
    paths: string[],
    folderPaths: string[],
    initialGraph: GraphIndex | null = null,
  ) => {
    set({
      allNotePaths: paths,
      allFolderPaths: folderPaths,
      openNotes: [],
      notesContent: {},
      dirtyNotes: new Set(),
      activeNotePath: null,
      graph: initialGraph,
      vaultUpdateCounter: get().vaultUpdateCounter + 1,
    });
  },

  updateAllPaths: (paths: string[]) => set({ allNotePaths: paths }),

  updateAllFolderPaths: (paths: string[]) => set({ allFolderPaths: paths }),

  incrementVaultUpdateCounter: () => {
    set((state) => ({ vaultUpdateCounter: state.vaultUpdateCounter + 1 }));
  },

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
      await persistNote(db, note);
      if (graph) {
        const nextGraph = updateGraphForNote(graph, note);
        set({
          graph: nextGraph,
          vaultUpdateCounter: get().vaultUpdateCounter + 1,
        });
      }
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

  renameNoteFromTree: async (oldPath: string, newStem: string) => {
    const trimmed = newStem.trim();
    if (!trimmed || !oldPath.endsWith(".md")) {
      return false;
    }
    const newPath = buildNotePathInFolder(oldPath, trimmed);
    if (newPath === oldPath) {
      return true;
    }
    const result = await renameNoteInVault(oldPath, newPath, {
      syncH1FromFilename: true,
    });
    return result.ok;
  },

  renameFolderFromTree: async (oldPath: string, newName: string) => {
    const result = await renameFolderInVault(oldPath, newName);
    if (!result.ok && result.reason === "collision") {
      console.warn(`[vault] Folder rename skipped — name already exists`);
    }
    return result.ok;
  },
}));
