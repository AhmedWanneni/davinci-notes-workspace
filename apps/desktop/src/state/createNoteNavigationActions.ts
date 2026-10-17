import { readNote, diskStateTracker } from "../vault";
import { flushH1DrivenRename } from "../vault/h1DrivenRename";
import { saveTimers } from "./saveTimers";
import {
  moveNoteHistory,
  pushNoteHistory,
  type NoteHistory,
} from "./noteHistory";

export interface NoteNavigationState {
  activeNotePath: string | null;
  openNotes: string[];
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  conflictNotes: Map<string, string>;
  allNotePaths: string[];
  isGlobalGraphOpen: boolean;
  noteHistory: NoteHistory;
}

export interface NoteNavigationActions {
  isGlobalGraphOpen: boolean;
  setIsGlobalGraphOpen: (open: boolean) => void;
  openNote: (path: string) => Promise<void>;
  closeNote: (path: string) => Promise<void>;
  setActiveNote: (path: string) => Promise<void>;
  closeAllNotes: () => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
}

export type NavigationStore = NoteNavigationState &
  NoteNavigationActions & {
    saveNoteNow: (path: string) => Promise<void>;
    saveAllDirty: () => Promise<void>;
  };

export function createNoteNavigationActions(
  get: () => NavigationStore,
  set: (
    updater:
      | Partial<NavigationStore>
      | ((state: NavigationStore) => Partial<NavigationStore>),
  ) => void,
): NoteNavigationActions {
  return {
    isGlobalGraphOpen: false,

    setIsGlobalGraphOpen: (open: boolean) => set({ isGlobalGraphOpen: open }),

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
        isGlobalGraphOpen: false,
      }));
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
      set({ activeNotePath: path, isGlobalGraphOpen: false });
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

    closeAllNotes: async () => {
      await get().saveAllDirty();
      diskStateTracker.clear();
      set({
        openNotes: [],
        activeNotePath: null,
        notesContent: {},
        dirtyNotes: new Set(),
        conflictNotes: new Map(),
        isGlobalGraphOpen: false,
      });
    },
  };
}
