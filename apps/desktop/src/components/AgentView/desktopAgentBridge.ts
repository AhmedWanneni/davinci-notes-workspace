import type {
  SearchResultItem,
  VaultInspectionBackend,
  VaultMutationBackend,
} from "@app/ai-agent";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  createNoteInVault,
  deleteNoteInVault,
  renameNoteInVault,
  getVaultIndexDb,
  withDbLock,
} from "../../vault";
import { readNote, writeNote } from "../../vault/vaultCommands";
import { executeSearchQuery, parseSearchQuery, type SearchResult } from "@app/indexer";
import { createLocalGitVersion } from "../../git/createLocalGitVersion";

export function createDesktopInspectionBackend(): VaultInspectionBackend {
  return {
    async listPaths(folderPath?: string) {
      const state = useWorkspaceStore.getState();
      const allFiles = state.allNotePaths;
      const allFolders = state.allFolderPaths;

      if (!folderPath) {
        return { files: allFiles, folders: allFolders };
      }

      const prefix = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;
      const filteredFiles = allFiles.filter((p) => p.startsWith(prefix));
      const filteredFolders = allFolders.filter((f) => f.startsWith(prefix));
      return { files: filteredFiles, folders: filteredFolders };
    },

    async readNote(path: string) {
      const state = useWorkspaceStore.getState();
      if (typeof state.notesContent[path] === "string") {
        return state.notesContent[path];
      }
      const file = await readNote(path);
      return file.content;
    },

    async searchFts(query: string, folder?: string, limit = 8): Promise<SearchResultItem[]> {
      try {
        const db = await getVaultIndexDb();
        const state = useWorkspaceStore.getState();
        const tagIndex = state.tagIndex ?? new Map();
        const parsed = parseSearchQuery(query);
        const results = await withDbLock(() => executeSearchQuery(db, tagIndex, parsed));
        const filtered = folder
          ? results.filter((r: SearchResult) => r.path.startsWith(folder.endsWith("/") ? folder : `${folder}/`))
          : results;
        return filtered.slice(0, limit).map((r: SearchResult) => ({
          path: r.path,
          snippet: r.snippet ?? "",
        }));
      } catch (e) {
        console.warn("[agent-bridge] FTS search fallback:", e);
        return [];
      }
    },

    async getStructure() {
      const state = useWorkspaceStore.getState();
      const tags: string[] = state.tagIndex ? Array.from(state.tagIndex.keys()) : [];
      return {
        folders: state.allFolderPaths,
        tags,
        totalNotes: state.allNotePaths.length,
      };
    },
  };
}

export function createDesktopMutationBackend(): VaultMutationBackend {
  return {
    async readNote(path: string): Promise<string | null> {
      try {
        const state = useWorkspaceStore.getState();
        if (typeof state.notesContent[path] === "string") {
          return state.notesContent[path];
        }
        const file = await readNote(path);
        return file.content;
      } catch {
        return null;
      }
    },

    async writeNote(path: string, content: string): Promise<void> {
      const state = useWorkspaceStore.getState();
      if (state.allNotePaths.includes(path)) {
        await writeNote(path, content);
        useWorkspaceStore.setState((s) => ({
          notesContent: { ...s.notesContent, [path]: content },
        }));
      } else {
        await createNoteInVault(path, content);
      }
      try {
        await createLocalGitVersion([path], false);
      } catch {
        // Git versioning is optional
      }
    },

    async deleteNote(path: string): Promise<void> {
      await deleteNoteInVault(path);
      try {
        await createLocalGitVersion([path], false);
      } catch {
        // Git versioning is optional
      }
    },

    async moveNote(fromPath: string, toPath: string): Promise<void> {
      await renameNoteInVault(fromPath, toPath);
      try {
        await createLocalGitVersion([fromPath, toPath], false);
      } catch {
        // Git versioning is optional
      }
    },
  };
}
