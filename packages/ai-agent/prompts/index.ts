import type { AgentToolDefinition } from "@app/ai-api";
import {
  LIST_VAULT_TREE_TOOL,
  READ_NOTE_TOOL,
  SEARCH_VAULT_TOOL,
} from "../vaultInspectionTools.js";
import {
  APPEND_TO_NOTE_TOOL,
  CREATE_DATABASE_TABLE_TOOL,
  CREATE_FOLDER_TOOL,
  CREATE_KANBAN_BOARD_TOOL,
  CREATE_NOTE_TOOL,
  CREATE_TODO_LIST_TOOL,
  EDIT_NOTE_TOOL,
  MOVE_NOTE_TOOL,
  SAVE_MEMORY_TOOL,
} from "../vaultMutationToolDefs.js";
import { buildSearchVaultPrompt } from "./searchVaultPrompt.js";
import { buildReadNotePrompt } from "./readNotePrompt.js";
import { buildCreateNotePrompt } from "./createNotePrompt.js";
import { buildEditNotePrompt } from "./editNotePrompt.js";
import { buildOrganizePrompt } from "./organizePrompt.js";
import { buildChatPrompt } from "./chatPrompt.js";

export type AgentIntent =
  | "search_vault"
  | "read_note"
  | "create_note"
  | "edit_note"
  | "organize"
  | "chat";

export {
  buildSearchVaultPrompt,
  buildReadNotePrompt,
  buildCreateNotePrompt,
  buildEditNotePrompt,
  buildOrganizePrompt,
  buildChatPrompt,
};

export function getScopedSystemPrompt(
  intent: AgentIntent,
  vaultName: string,
  existingNotes?: string[],
): string {
  switch (intent) {
    case "search_vault":
      return buildSearchVaultPrompt(vaultName);
    case "read_note":
      return buildReadNotePrompt(vaultName);
    case "create_note":
      return buildCreateNotePrompt(vaultName, existingNotes);
    case "edit_note":
      return buildEditNotePrompt(vaultName);
    case "organize":
      return buildOrganizePrompt(vaultName, existingNotes);
    case "chat":
      return buildChatPrompt(vaultName);
  }
}

export function getScopedTools(intent: AgentIntent): AgentToolDefinition[] {
  switch (intent) {
    case "search_vault":
      return [SEARCH_VAULT_TOOL, LIST_VAULT_TREE_TOOL];
    case "read_note":
      return [READ_NOTE_TOOL, SEARCH_VAULT_TOOL];
    case "create_note":
      return [
        CREATE_NOTE_TOOL,
        CREATE_FOLDER_TOOL,
        MOVE_NOTE_TOOL,
        LIST_VAULT_TREE_TOOL,
        CREATE_KANBAN_BOARD_TOOL,
        CREATE_DATABASE_TABLE_TOOL,
        CREATE_TODO_LIST_TOOL,
        SEARCH_VAULT_TOOL,
        SAVE_MEMORY_TOOL,
      ];
    case "edit_note":
      return [READ_NOTE_TOOL, EDIT_NOTE_TOOL, APPEND_TO_NOTE_TOOL, SAVE_MEMORY_TOOL];
    case "organize":
      return [
        LIST_VAULT_TREE_TOOL,
        MOVE_NOTE_TOOL,
        CREATE_FOLDER_TOOL,
        READ_NOTE_TOOL,
        SAVE_MEMORY_TOOL,
      ];
    case "chat":
      return [SAVE_MEMORY_TOOL];
  }
}
