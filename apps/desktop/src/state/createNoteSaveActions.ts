import {
  type ConflictResolutionChoice,
  type WorkspaceSaveContext,
  type WorkspaceSaveUpdater,
  performSaveNote,
  resolveConflictKeepMine,
  resolveConflictUseDisk,
  resolveConflictSaveCopy,
} from "../vault";
import { flushH1DrivenRename } from "../vault/h1DrivenRename";
import { saveTimers } from "./saveTimers";

export interface NoteSaveActions {
  saveNoteNow: (path: string) => Promise<void>;
  saveVersionNow: (path: string) => Promise<void>;
  saveAllDirty: () => Promise<void>;
  resolveConflict: (
    path: string,
    choice: ConflictResolutionChoice,
  ) => Promise<void>;
}

export function createNoteSaveActions<
  T extends WorkspaceSaveContext & {
    openNotes: string[];
    saveNoteNow: (path: string) => Promise<void>;
  },
>(get: () => T, set: WorkspaceSaveUpdater): NoteSaveActions {
  return {
    saveNoteNow: async (path: string) => {
      await performSaveNote(path, get, set);
    },

    saveVersionNow: async (path: string) => {
      await get().saveNoteNow(path);
      const { loadGitVersioning } = await import("../git/loadGitVersioning");
      const { versionHistoryScheduler } = await loadGitVersioning();
      await versionHistoryScheduler.saveVersionNow(path);
    },

    saveAllDirty: async () => {
      const { dirtyNotes, openNotes, conflictNotes } = get();
      for (const path of openNotes) {
        await flushH1DrivenRename(path);
      }
      for (const path of Array.from(dirtyNotes)) {
        if (saveTimers[path]) {
          clearTimeout(saveTimers[path]);
          delete saveTimers[path];
        }
        if (conflictNotes.has(path)) {
          await resolveConflictSaveCopy(path, get(), set);
        } else {
          await get().saveNoteNow(path);
        }
      }
    },

    resolveConflict: async (path: string, choice: ConflictResolutionChoice) => {
      if (choice === "keep_mine") {
        await resolveConflictKeepMine(path, get(), set);
      } else if (choice === "use_disk") {
        await resolveConflictUseDisk(path, set);
      } else if (choice === "save_copy") {
        await resolveConflictSaveCopy(path, get(), set);
      }
    },
  };
}
