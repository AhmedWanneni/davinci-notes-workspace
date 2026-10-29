import type { AgentToolDefinition } from "@app/ai-api";
import { validateVaultRelativePath } from "./safetyJail.js";
import { encapsulateVaultNoteContent } from "./untrustedContentGuard.js";

export interface SearchResultItem {
  path: string;
  snippet: string;
  score?: number;
  mode?: "fts" | "semantic";
}

export interface VaultInspectionBackend {
  listPaths(folderPath?: string): Promise<{ files: string[]; folders: string[] }>;
  readNote(path: string): Promise<string>;
  searchFts?(query: string, folder?: string, limit?: number): Promise<SearchResultItem[]>;
  searchSemantic?(query: string, folder?: string, limit?: number): Promise<SearchResultItem[]>;
  getStructure?(): Promise<{ folders: string[]; tags: string[]; totalNotes: number }>;
}

export const LIST_VAULT_TREE_TOOL: AgentToolDefinition = {
  name: "list_vault_tree",
  description: "List notes and subfolders in the vault or inside a specific folder",
  parameters: {
    type: "object",
    properties: {
      folderPath: { type: "string", description: "Optional folder path to list (e.g. 'Finance')" },
    },
  },
};

export const READ_NOTE_TOOL: AgentToolDefinition = {
  name: "read_note",
  description: "Read the markdown content of a specific note in the vault",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault-relative path to the note (e.g. 'Finance/Q3.md')" },
    },
    required: ["path"],
  },
};

export const SEARCH_VAULT_TOOL: AgentToolDefinition = {
  name: "search_vault",
  description: "Search notes across the vault using keyword (FTS) or semantic search",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query text" },
      mode: {
        type: "string",
        enum: ["hybrid", "fts", "semantic"],
        description: "Search modality: 'hybrid' (default), 'fts' (exact keywords), or 'semantic' (conceptual)",
      },
      folder: { type: "string", description: "Optional folder path to constrain search" },
      limit: { type: "integer", description: "Max results to return (default 8, max 20)" },
    },
    required: ["query"],
  },
};

export const GET_VAULT_STRUCTURE_TOOL: AgentToolDefinition = {
  name: "get_vault_structure",
  description: "Get top-level vault folder taxonomy and active tag summary",
  parameters: {
    type: "object",
    properties: {},
  },
};

export const VAULT_INSPECTION_TOOLS: AgentToolDefinition[] = [
  LIST_VAULT_TREE_TOOL,
  READ_NOTE_TOOL,
  SEARCH_VAULT_TOOL,
  GET_VAULT_STRUCTURE_TOOL,
];

export async function executeInspectionTool(
  toolName: string,
  args: Record<string, unknown>,
  backend: VaultInspectionBackend,
): Promise<unknown> {
  switch (toolName) {
    case "list_vault_tree": {
      const folderPath = typeof args.folderPath === "string" && args.folderPath.trim()
        ? validateVaultRelativePath(args.folderPath)
        : undefined;
      const res = await backend.listPaths(folderPath);
      return {
        folder: folderPath ?? "root",
        folders: res.folders.slice(0, 50),
        files: res.files.slice(0, 100),
        totalFiles: res.files.length,
      };
    }

    case "read_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const raw = await backend.readNote(path);
      return {
        path,
        content: encapsulateVaultNoteContent(raw, { notePath: path }),
      };
    }

    case "search_vault": {
      const query = String(args.query ?? "").trim();
      if (!query) throw new Error("search_vault requires a non-empty query");
      const mode = (args.mode as "hybrid" | "fts" | "semantic") || "hybrid";
      const folder = typeof args.folder === "string" && args.folder.trim()
        ? validateVaultRelativePath(args.folder)
        : undefined;
      const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 20);

      const results: SearchResultItem[] = [];
      const seenPaths = new Set<string>();

      if ((mode === "hybrid" || mode === "fts") && backend.searchFts) {
        const ftsHits = await backend.searchFts(query, folder, limit);
        for (const hit of ftsHits) {
          if (!seenPaths.has(hit.path)) {
            seenPaths.add(hit.path);
            results.push({ ...hit, mode: "fts" });
          }
        }
      }

      if ((mode === "hybrid" || mode === "semantic") && backend.searchSemantic) {
        const semanticHits = await backend.searchSemantic(query, folder, limit);
        for (const hit of semanticHits) {
          if (!seenPaths.has(hit.path)) {
            seenPaths.add(hit.path);
            results.push({ ...hit, mode: "semantic" });
          }
        }
      }

      return {
        query,
        count: results.length,
        results: results.slice(0, limit),
      };
    }

    case "get_vault_structure": {
      if (backend.getStructure) {
        return backend.getStructure();
      }
      const root = await backend.listPaths();
      return { folders: root.folders, totalNotes: root.files.length, tags: [] };
    }

    default:
      throw new Error(`Unknown inspection tool: "${toolName}"`);
  }
}
