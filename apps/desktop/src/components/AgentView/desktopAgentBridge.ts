import {
  type SearchResultItem,
  type VaultInspectionBackend,
  type VaultMutationBackend,
  type WebSearchBackend,
  type WebSearchResultItem,
  parseDuckDuckGoHtml,
} from "@app/ai-agent";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  createNoteInVault,
  deleteFolderInVault,
  deleteNoteInVault,
  renameNoteInVault,
  getVaultIndexDb,
  withDbLock,
} from "../../vault";
import { createFolder, readNote, writeNote } from "../../vault/vaultCommands";
import {
  executeSearchQuery,
  parseSearchQuery,
  type SearchResult,
} from "@app/indexer";
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

    async searchFts(
      query: string,
      folder?: string,
      limit = 8,
    ): Promise<SearchResultItem[]> {
      try {
        const db = await getVaultIndexDb();
        const state = useWorkspaceStore.getState();
        const tagIndex = state.tagIndex ?? new Map();
        const parsed = parseSearchQuery(query);
        const results = await withDbLock(() =>
          executeSearchQuery(db, tagIndex, parsed),
        );
        const filtered = folder
          ? results.filter((r: SearchResult) =>
              r.path.startsWith(folder.endsWith("/") ? folder : `${folder}/`),
            )
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
      const tags: string[] = state.tagIndex
        ? Array.from(state.tagIndex.keys())
        : [];
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
      const parts = path.split("/");
      if (parts.length > 1) {
        const folderPath = parts.slice(0, -1).join("/");
        const st = useWorkspaceStore.getState();
        if (!st.allFolderPaths.includes(folderPath)) {
          try {
            await createFolder(folderPath);
          } catch {
            // folder may already exist
          }
          const updated = [...st.allFolderPaths, folderPath].sort();
          st.updateAllFolderPaths(updated);
        }
      }

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
      try {
        await useWorkspaceStore.getState().openNote(path);
      } catch {
        // Best effort tab opening
      }
    },

    async createFolder(path: string): Promise<void> {
      const cleanPath = path.trim().replace(/^\/+|\/+$/g, "");
      if (!cleanPath) return;
      await createFolder(cleanPath);
      const state = useWorkspaceStore.getState();
      if (!state.allFolderPaths.includes(cleanPath)) {
        const updated = [...state.allFolderPaths, cleanPath].sort();
        state.updateAllFolderPaths(updated);
      }
    },

    async deleteFolder(path: string): Promise<void> {
      const cleanPath = path.trim().replace(/^\/+|\/+$/g, "");
      if (!cleanPath) return;
      await deleteFolderInVault(cleanPath);
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

export function createDesktopWebSearchBackend(): WebSearchBackend {
  return {
    async search(query: string, limit = 5): Promise<WebSearchResultItem[]> {
      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
          `https://html.duckduckgo.com/html/?q=${encoded}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        );
        if (!res.ok)
          throw new Error(`Search request failed with status ${res.status}`);
        const html = await res.text();
        return parseDuckDuckGoHtml(html).slice(0, limit);
      } catch (err) {
        console.warn("[agent-bridge] Web search offline or error:", err);
        return [];
      }
    },
  };
}
