import type { AgentToolDefinition } from "@app/ai-api";
import { validateVaultRelativePath } from "./safetyJail.js";
import { lineDiff, type DiffLine } from "./lineDiff.js";
import type { FileChangeRecord } from "./changeLedgerTypes.js";
import { generateDatabaseMarkdown, type DatabaseColumnDef } from "./databaseNoteGenerator.js";
import { generateTaskListMarkdown, type TaskItemDef } from "./taskListGenerator.js";

export interface VaultMutationBackend {
  readNote(path: string): Promise<string | null>;
  writeNote(path: string, content: string): Promise<void>;
  deleteNote(path: string): Promise<void>;
  moveNote(fromPath: string, toPath: string): Promise<void>;
}

export interface MutationPlanResult {
  changeRecord: FileChangeRecord;
  diff: DiffLine[];
}

export const CREATE_NOTE_TOOL: AgentToolDefinition = {
  name: "create_note",
  description: "Create a new note in the vault with optional markdown content",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path (e.g. 'Summaries/Weekly.md')" },
      content: { type: "string", description: "Markdown text content" },
    },
    required: ["path"],
  },
};

export const EDIT_NOTE_TOOL: AgentToolDefinition = {
  name: "edit_note",
  description: "Replace the full content of an existing note in the vault",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path of note to edit" },
      content: { type: "string", description: "New full markdown content" },
    },
    required: ["path", "content"],
  },
};

export const APPEND_TO_NOTE_TOOL: AgentToolDefinition = {
  name: "append_to_note",
  description: "Append or prepend content into an existing note",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path of note" },
      content: { type: "string", description: "Text to insert" },
      position: { type: "string", enum: ["bottom", "top"], description: "Insert position (default: 'bottom')" },
    },
    required: ["path", "content"],
  },
};

export const MOVE_NOTE_TOOL: AgentToolDefinition = {
  name: "move_note",
  description: "Move or rename a note in the vault",
  parameters: {
    type: "object",
    properties: {
      fromPath: { type: "string", description: "Current note path" },
      toPath: { type: "string", description: "New destination path" },
    },
    required: ["fromPath", "toPath"],
  },
};

export const DELETE_NOTE_TOOL: AgentToolDefinition = {
  name: "delete_note",
  description: "Delete a note from the vault",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path of note to delete" },
    },
    required: ["path"],
  },
};

export const CREATE_DATABASE_TABLE_TOOL: AgentToolDefinition = {
  name: "create_database_table",
  description: "Create a structured Markdown database note with typed columns and rows",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path (e.g. 'Finance/Invoices.md')" },
      title: { type: "string", description: "Optional note heading title" },
      columns: {
        type: "array",
        description: "List of columns: { name: string, type: 'text' | 'number' | 'select' | 'checkbox' | 'date', options?: string[] }",
      },
      rows: { type: "array", description: "List of row records mapping column names to values" },
    },
    required: ["path", "columns"],
  },
};

export const CREATE_TODO_LIST_TOOL: AgentToolDefinition = {
  name: "create_todo_list",
  description: "Create a note with tasks and optional date/time reminder tokens",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Vault path (e.g. 'Daily/Todos.md')" },
      title: { type: "string", description: "Note title" },
      tasks: {
        type: "array",
        description: "List of task items: { text: string, done?: boolean, dueAtUtc?: string, recurrence?: string }",
      },
    },
    required: ["path", "tasks"],
  },
};

export const VAULT_MUTATION_TOOLS: AgentToolDefinition[] = [
  CREATE_NOTE_TOOL,
  EDIT_NOTE_TOOL,
  APPEND_TO_NOTE_TOOL,
  MOVE_NOTE_TOOL,
  DELETE_NOTE_TOOL,
  CREATE_DATABASE_TABLE_TOOL,
  CREATE_TODO_LIST_TOOL,
];

export async function planMutation(
  toolName: string,
  args: Record<string, unknown>,
  backend: VaultMutationBackend,
): Promise<MutationPlanResult> {
  switch (toolName) {
    case "create_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const content = String(args.content ?? "");
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "edit_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const content = String(args.content ?? "");
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "modify", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "append_to_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const textToAppend = String(args.content ?? "");
      const pos = args.position === "top" ? "top" : "bottom";
      const beforeContent = (await backend.readNote(path)) ?? "";
      const afterContent = pos === "bottom"
        ? (beforeContent ? `${beforeContent.trimEnd()}\n\n${textToAppend}\n` : `${textToAppend}\n`)
        : (beforeContent ? `${textToAppend}\n\n${beforeContent.trimStart()}` : `${textToAppend}\n`);
      const changeRecord: FileChangeRecord = { action: "modify", path, beforeContent, afterContent };
      return { changeRecord, diff: lineDiff(beforeContent, afterContent) };
    }

    case "move_note": {
      const fromPath = validateVaultRelativePath(String(args.fromPath ?? ""));
      const toPath = validateVaultRelativePath(String(args.toPath ?? ""));
      const content = await backend.readNote(fromPath);
      const changeRecord: FileChangeRecord = {
        action: "move",
        path: toPath,
        fromPath,
        beforeContent: content,
        afterContent: content,
      };
      return { changeRecord, diff: [{ kind: "unchanged", text: `Move ${fromPath} -> ${toPath}` }] };
    }

    case "delete_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "delete", path, beforeContent, afterContent: null };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", "") };
    }

    case "create_database_table": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const columns = (args.columns as DatabaseColumnDef[]) ?? [];
      const rows = (args.rows as Array<Record<string, unknown>>) ?? [];
      const title = args.title ? String(args.title) : undefined;
      const content = generateDatabaseMarkdown({ title, columns, rows: rows as any });
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "create_todo_list": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const tasks = (args.tasks as TaskItemDef[]) ?? [];
      const title = args.title ? String(args.title) : undefined;
      const content = generateTaskListMarkdown({ title, tasks });
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    default:
      throw new Error(`Unknown mutation tool: "${toolName}"`);
  }
}

export async function applyPlannedMutation(
  change: FileChangeRecord,
  backend: VaultMutationBackend,
): Promise<void> {
  switch (change.action) {
    case "create":
    case "modify":
      await backend.writeNote(change.path, change.afterContent ?? "");
      break;

    case "delete":
      await backend.deleteNote(change.path);
      break;

    case "move":
      if (change.fromPath) {
        await backend.moveNote(change.fromPath, change.path);
      }
      break;
  }
}
