import {
  deleteNoteInVault,
  duplicateNoteInVault,
  renameFolderInVault,
  renameNoteInVault,
} from "../vault";
import { buildNotePathInFolder } from "../vault/sanitizeFilenameStem";

export interface NoteCrudActions {
  renameNoteFromTree: (oldPath: string, newStem: string) => Promise<boolean>;
  renameFolderFromTree: (oldPath: string, newName: string) => Promise<boolean>;
  deleteNoteFromTree: (path: string) => Promise<boolean>;
  duplicateNoteFromTree: (path: string) => Promise<boolean>;
}

export function createNoteCrudActions(): NoteCrudActions {
  return {
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
        console.warn("[vault] Folder rename skipped - name already exists");
      }
      return result.ok;
    },

    deleteNoteFromTree: async (path: string) => {
      const result = await deleteNoteInVault(path);
      if (!result.ok) {
        console.warn(`[vault] Note delete skipped - ${result.reason}`);
      }
      return result.ok;
    },

    duplicateNoteFromTree: async (path: string) => {
      const result = await duplicateNoteInVault(path);
      if (!result.ok) {
        console.warn(`[vault] Note duplicate skipped - ${result.reason}`);
      }
      return result.ok;
    },
  };
}
