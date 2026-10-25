import type { ValidationResult } from "./rewriteSchema.js";

export const ALLOWED_AGENT_ACTIONS = [
  "search_vault",
  "list_vault_tree",
  "read_note",
  "create_note",
  "create_folder",
  "create_kanban_board",
  "create_database_table",
  "create_todo_list",
  "edit_note",
  "append_to_note",
  "move_note",
  "delete_note",
  "web_search",
] as const;

export type AllowedAgentAction = (typeof ALLOWED_AGENT_ACTIONS)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_AGENT_ACTIONS);

export function isAllowedAction(name: string): name is AllowedAgentAction {
  return ALLOWED_SET.has(name);
}

export function isDestructiveAction(
  name: string,
  _args?: Record<string, unknown>,
): boolean {
  return (
    name === "delete_note" ||
    name === "edit_note" ||
    name === "move_note"
  );
}

export interface ValidatedAction {
  name: AllowedAgentAction;
  arguments: Record<string, unknown>;
  isDestructive: boolean;
}

export function validateAgentAction(
  name: string,
  args: unknown,
): ValidationResult<ValidatedAction> {
  if (!isAllowedAction(name)) {
    return {
      success: false,
      error: `Action "${name}" is not in the allowed actions list. Allowed: ${ALLOWED_AGENT_ACTIONS.join(", ")}`,
    };
  }

  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    return {
      success: false,
      error: `Arguments for action "${name}" must be an object.`,
    };
  }

  const record = args as Record<string, unknown>;

  // Specific parameter validations
  switch (name) {
    case "read_note":
    case "create_note":
    case "create_folder":
    case "create_kanban_board":
    case "create_database_table":
    case "delete_note": {
      if (typeof record.path !== "string" || !record.path.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "path".`,
        };
      }
      break;
    }
    case "edit_note": {
      if (typeof record.path !== "string" || !record.path.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "path".`,
        };
      }
      if (typeof record.content !== "string") {
        return {
          success: false,
          error: `Action "${name}" requires string "content".`,
        };
      }
      break;
    }
    case "append_to_note": {
      if (typeof record.path !== "string" || !record.path.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "path".`,
        };
      }
      if (typeof record.content !== "string") {
        return {
          success: false,
          error: `Action "${name}" requires string "content".`,
        };
      }
      break;
    }
    case "move_note": {
      if (typeof record.fromPath !== "string" || !record.fromPath.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "fromPath".`,
        };
      }
      if (typeof record.toPath !== "string" || !record.toPath.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "toPath".`,
        };
      }
      break;
    }
    case "create_todo_list": {
      if (typeof record.path !== "string" || !record.path.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "path".`,
        };
      }
      if (!Array.isArray(record.tasks)) {
        return {
          success: false,
          error: `Action "${name}" requires an array "tasks".`,
        };
      }
      break;
    }
    case "search_vault":
    case "web_search": {
      if (typeof record.query !== "string" || !record.query.trim()) {
        return {
          success: false,
          error: `Action "${name}" requires a non-empty string "query".`,
        };
      }
      break;
    }
    case "list_vault_tree":
      // All args optional
      break;
  }

  return {
    success: true,
    data: {
      name,
      arguments: record,
      isDestructive: isDestructiveAction(name, record),
    },
  };
}
