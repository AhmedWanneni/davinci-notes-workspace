import { create } from "zustand";
import type { Note } from "@app/core-types";
import { buildGraph, updateGraphForNote, type GraphIndex } from "@app/indexer";
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
} from "../vault";

interface WorkspaceState {
  activeNotePath: string | null;
  openNotes: string[];
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  allNotePaths: string[];
  graph: GraphIndex | null;
  vaultUpdateCounter: number;

  // Actions
  initializeVault: (paths: string[]) => Promise<void>;
  updateAllPaths: (paths: string[]) => void;
  incrementVaultUpdateCounter: () => void;
  openNote: (path: string) => Promise<void>;
  closeNote: (path: string) => Promise<void>;
  setActiveNote: (path: string) => Promise<void>;
  updateNoteContent: (path: string, content: string) => void;
  saveNoteNow: (path: string) => Promise<void>;
  saveAllDirty: () => Promise<void>;

  // Settings
  editorFont: string;
  loadSettings: () => Promise<void>;
  setEditorFont: (font: string) => Promise<void>;
}

// Module-level cache for debounced save timeouts
const saveTimers: Record<string, NodeJS.Timeout> = {};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeNotePath: null,
  openNotes: [],
  notesContent: {},
  dirtyNotes: new Set(),
  allNotePaths: [],
  graph: null,
  vaultUpdateCounter: 0,
  editorFont: "system",

  loadSettings: async () => {
    try {
      const db = await getVaultIndexDb();
      const font = await withDbLock(() => getSetting(db, "editorFont"));
      if (font) {
        set({ editorFont: font });
      }
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

  initializeVault: async (paths: string[]) => {
    // Build initial graph in memory based on current files
    const notes: Note[] = [];
    for (const path of paths) {
      try {
        const file = await readNote(path);
        notes.push(noteFromMarkdown(path, file.content, file.mtime, paths));
      } catch (e) {
        console.error(`Failed to read note during init: ${path}`, e);
      }
    }
    const graph = buildGraph(notes);

    set({
      allNotePaths: paths,
      graph,
      vaultUpdateCounter: get().vaultUpdateCounter + 1,
    });
  },

  updateAllPaths: (paths: string[]) => {
    set({ allNotePaths: paths });
  },

  incrementVaultUpdateCounter: () => {
    set((state) => ({ vaultUpdateCounter: state.vaultUpdateCounter + 1 }));
  },

  openNote: async (path: string) => {
    const { notesContent, openNotes } = get();

    // If the note content is not in memory, load it from disk
    if (notesContent[path] === undefined) {
      try {
        const file = await readNote(path);
        set((state) => ({
          notesContent: {
            ...state.notesContent,
            [path]: file.content,
          },
        }));
      } catch (e) {
        console.error(`Failed to open note: ${path}`, e);
        return;
      }
    }

    // Add note to open tabs if it's not already there
    const nextOpenNotes = openNotes.includes(path)
      ? openNotes
      : [...openNotes, path];

    // Set as active
    await get().setActiveNote(path);
    set({ openNotes: nextOpenNotes });
  },

  closeNote: async (path: string) => {
    const { openNotes, activeNotePath } = get();

    // Clear timeout and save immediately if dirty
    if (saveTimers[path]) {
      clearTimeout(saveTimers[path]);
      delete saveTimers[path];
    }
    await get().saveNoteNow(path);

    const nextOpenNotes = openNotes.filter((p) => p !== path);
    let nextActivePath = activeNotePath;

    if (activeNotePath === path) {
      nextActivePath =
        nextOpenNotes.length > 0
          ? nextOpenNotes[nextOpenNotes.length - 1]
          : null;
    }

    set({
      openNotes: nextOpenNotes,
      activeNotePath: nextActivePath,
    });
  },

  setActiveNote: async (path: string) => {
    const { activeNotePath, dirtyNotes } = get();

    // If switching away from a dirty note, flush its save immediately
    if (
      activeNotePath &&
      activeNotePath !== path &&
      dirtyNotes.has(activeNotePath)
    ) {
      if (saveTimers[activeNotePath]) {
        clearTimeout(saveTimers[activeNotePath]);
        delete saveTimers[activeNotePath];
      }
      await get().saveNoteNow(activeNotePath);
    }

    set({ activeNotePath: path });
  },

  updateNoteContent: (path: string, content: string) => {
    set((state) => {
      const nextDirty = new Set(state.dirtyNotes);
      nextDirty.add(path);
      return {
        notesContent: {
          ...state.notesContent,
          [path]: content,
        },
        dirtyNotes: nextDirty,
      };
    });

    // Reset debounced save timer
    if (saveTimers[path]) {
      clearTimeout(saveTimers[path]);
    }

    saveTimers[path] = setTimeout(async () => {
      delete saveTimers[path];
      await get().saveNoteNow(path);
    }, 750); // Debounce save: 750ms after typing stops
  },

  saveNoteNow: async (path: string) => {
    const { notesContent, dirtyNotes, allNotePaths, graph } = get();
    if (!dirtyNotes.has(path) || notesContent[path] === undefined) {
      return;
    }

    const content = notesContent[path];

    // 1. Save to disk using watcher suppression
    try {
      await withVaultWatchSuppressed(async () => {
        await writeNote(path, content);
      });
    } catch (e) {
      console.error(`Failed to write note: ${path}`, e);
      return;
    }

    // 2. Incremental reindex in SQLite DB
    try {
      const db = await getVaultIndexDb();
      const note = noteFromMarkdown(path, content, Date.now(), allNotePaths);
      await persistNote(db, note);

      // 3. Incremental update in-memory graph
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

    // 4. Clear dirty state
    set((state) => {
      const nextDirty = new Set(state.dirtyNotes);
      nextDirty.delete(path);
      return { dirtyNotes: nextDirty };
    });
  },

  saveAllDirty: async () => {
    const { dirtyNotes } = get();
    for (const path of Array.from(dirtyNotes)) {
      if (saveTimers[path]) {
        clearTimeout(saveTimers[path]);
        delete saveTimers[path];
      }
      await get().saveNoteNow(path);
    }
  },
}));
