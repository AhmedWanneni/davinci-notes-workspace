import { validateVaultRelativePath } from "./safetyJail.js";
import { lineDiff, type DiffLine } from "./lineDiff.js";
import type { FileChangeRecord } from "./changeLedgerTypes.js";
import {
  generateDatabaseMarkdown,
  type DatabaseColumnDef,
} from "./databaseNoteGenerator.js";
import {
  generateTaskListMarkdown,
  type TaskItemDef,
} from "./taskListGenerator.js";
import {
  generateKanbanMarkdown,
  type KanbanLaneDef,
} from "./kanbanNoteGenerator.js";

export * from "./vaultMutationToolDefs.js";

export interface VaultMutationBackend {
  readNote(path: string): Promise<string | null>;
  writeNote(path: string, content: string): Promise<void>;
  deleteNote(path: string): Promise<void>;
  moveNote(fromPath: string, toPath: string): Promise<void>;
  createFolder?(path: string): Promise<void>;
  deleteFolder?(path: string): Promise<void>;
}

export interface MutationPlanResult {
  changeRecord: FileChangeRecord;
  diff: DiffLine[];
}

function ensureMd(path: string): string {
  const clean = path.trim().replace(/^\/+|\/+$/g, "");
  return clean.toLowerCase().endsWith(".md") ? clean : `${clean}.md`;
}

function cleanFolderPath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

const DEFAULT_DB_COLS: DatabaseColumnDef[] = [
  { name: "Name", type: "text" },
  { name: "Status", type: "select", options: ["To Do", "In Progress", "Done"] },
  { name: "Date", type: "date" },
];

export async function planMutation(
  toolName: string,
  args: Record<string, unknown>,
  backend: VaultMutationBackend,
): Promise<MutationPlanResult> {
  switch (toolName) {
    case "create_note":
    case "create_file":
    case "write_file":
    case "new_file": {
      const path = validateVaultRelativePath(ensureMd(String(args.path ?? "Untitled.md")));
      const content = String(args.content ?? "");
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "create_folder":
    case "create_directory": {
      const path = validateVaultRelativePath(cleanFolderPath(String(args.path ?? "")));
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent: null, afterContent: null };
      return { changeRecord, diff: [{ kind: "added", text: `[Folder] ${path}` }] };
    }

    case "create_kanban_board":
    case "create_kanban":
    case "create_board": {
      const path = validateVaultRelativePath(ensureMd(String(args.path ?? "Kanban.md")));
      const title = args.title ? String(args.title) : undefined;
      const lanes = (args.lanes as KanbanLaneDef[]) ?? [];
      const content = generateKanbanMarkdown({ title, lanes });
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = { action: "create", path, beforeContent, afterContent: content };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "edit_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const content = String(args.content ?? "");
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = {
        action: "modify",
        path,
        beforeContent,
        afterContent: content,
      };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "append_to_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const textToAppend = String(args.content ?? "");
      const pos = args.position === "top" ? "top" : "bottom";
      const beforeContent = (await backend.readNote(path)) ?? "";
      const afterContent =
        pos === "bottom"
          ? beforeContent
            ? `${beforeContent.trimEnd()}\n\n${textToAppend}\n`
            : `${textToAppend}\n`
          : beforeContent
            ? `${textToAppend}\n\n${beforeContent.trimStart()}`
            : `${textToAppend}\n`;
      const changeRecord: FileChangeRecord = {
        action: "modify",
        path,
        beforeContent,
        afterContent,
      };
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
      return {
        changeRecord,
        diff: [{ kind: "unchanged", text: `Move ${fromPath} -> ${toPath}` }],
      };
    }

    case "delete_note": {
      const path = validateVaultRelativePath(String(args.path ?? ""));
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = {
        action: "delete",
        path,
        beforeContent,
        afterContent: null,
      };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", "") };
    }

    case "create_database_table":
    case "create_database":
    case "create_database_note": {
      const path = validateVaultRelativePath(
        ensureMd(String(args.path ?? "Database.md")),
      );
      const passedCols = args.columns as DatabaseColumnDef[] | undefined;
      const columns =
        Array.isArray(passedCols) && passedCols.length > 0
          ? passedCols
          : DEFAULT_DB_COLS;
      const rows =
        (args.rows as Array<
          Record<string, string | number | boolean | null | undefined>
        >) ?? [];
      const title = args.title ? String(args.title) : undefined;
      const content = generateDatabaseMarkdown({ title, columns, rows });
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = {
        action: "create",
        path,
        beforeContent,
        afterContent: content,
      };
      return { changeRecord, diff: lineDiff(beforeContent ?? "", content) };
    }

    case "create_todo_list": {
      const path = validateVaultRelativePath(
        ensureMd(String(args.path ?? "Todos.md")),
      );
      const tasks = (args.tasks as TaskItemDef[]) ?? [];
      const title = args.title ? String(args.title) : undefined;
      const content = generateTaskListMarkdown({ title, tasks });
      const beforeContent = await backend.readNote(path);
      const changeRecord: FileChangeRecord = {
        action: "create",
        path,
        beforeContent,
        afterContent: content,
      };
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
      if (change.afterContent === null && backend.createFolder) {
        await backend.createFolder(change.path);
      } else {
        await backend.writeNote(change.path, change.afterContent ?? "");
      }
      break;

    case "delete":
      if (change.beforeContent === null && backend.deleteFolder) {
        await backend.deleteFolder(change.path);
      } else {
        await backend.deleteNote(change.path);
      }
      break;

    case "move":
      if (change.fromPath) {
        await backend.moveNote(change.fromPath, change.path);
      }
      break;
  }
}
