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

export function normalizeVaultPath(
  inputPath: string,
  allNotes: string[] = [],
): string {
  const clean = inputPath.trim().replace(/^[./\\]+/, "");
  if (!clean) return inputPath;
  if (allNotes.includes(clean)) return clean;
  if (!clean.endsWith(".md") && !clean.endsWith(".canvas")) {
    if (allNotes.includes(`${clean}.md`)) return `${clean}.md`;
  }
  const lower = clean.toLowerCase();
  const match = allNotes.find(
    (n) => n.toLowerCase() === lower || n.toLowerCase() === `${lower}.md`,
  );
  if (match) return match;
  return clean.endsWith(".md") ||
    clean.endsWith(".json") ||
    clean.endsWith(".canvas")
    ? clean
    : `${clean}.md`;
}

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
      const resolved = normalizeVaultPath(path, state.allNotePaths);
      if (typeof state.notesContent[resolved] === "string") {
        return state.notesContent[resolved];
      }
      try {
        const file = await readNote(resolved);
        return file.content;
      } catch {
        const fallback = await readNote(path);
        return fallback.content;
      }
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
        const resolved = normalizeVaultPath(path, state.allNotePaths);
        if (typeof state.notesContent[resolved] === "string") {
          return state.notesContent[resolved];
        }
        const file = await readNote(resolved);
        return file.content;
      } catch {
        return null;
      }
    },

    async writeNote(path: string, content: string): Promise<void> {
      const state = useWorkspaceStore.getState();
      const resolved = normalizeVaultPath(path, state.allNotePaths);
      const parts = resolved.split("/");
      if (parts.length > 1) {
        const folderPath = parts.slice(0, -1).join("/");
        if (!state.allFolderPaths.includes(folderPath)) {
          try {
            await createFolder(folderPath);
          } catch {
            // folder may already exist
          }
          const updated = [...state.allFolderPaths, folderPath].sort();
          state.updateAllFolderPaths(updated);
        }
      }

      if (state.allNotePaths.includes(resolved)) {
        await writeNote(resolved, content);
        useWorkspaceStore.setState((s) => ({
          notesContent: { ...s.notesContent, [resolved]: content },
        }));
      } else {
        await createNoteInVault(resolved, content);
      }
      try {
        await createLocalGitVersion([resolved], false);
      } catch {
        // Git versioning is optional
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
      const state = useWorkspaceStore.getState();
      const resolved = normalizeVaultPath(path, state.allNotePaths);
      await deleteNoteInVault(resolved);
      try {
        await createLocalGitVersion([resolved], false);
      } catch {
        // Git versioning is optional
      }
    },

    async moveNote(fromPath: string, toPath: string): Promise<void> {
      const state = useWorkspaceStore.getState();
      const resolvedFrom = normalizeVaultPath(fromPath, state.allNotePaths);
      const resolvedTo = normalizeVaultPath(toPath, state.allNotePaths);
      await renameNoteInVault(resolvedFrom, resolvedTo);
      try {
        await createLocalGitVersion([resolvedFrom, resolvedTo], false);
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
