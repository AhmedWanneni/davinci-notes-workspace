import type { AgentToolDefinition } from "@app/ai-api";

export const CREATE_NOTE_TOOL: AgentToolDefinition = {
  name: "create_note",
  description:
    "Create a new note or file in the vault with optional markdown content",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Vault path of the note/file (e.g. 'Summaries/Weekly.md' or 'sisi.md')",
      },
      content: { type: "string", description: "Markdown text content" },
    },
    required: ["path"],
  },
};

export const CREATE_FOLDER_TOOL: AgentToolDefinition = {
  name: "create_folder",
  description:
    "Create a new folder or directory in the vault (for directories only, NOT for files)",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Folder path (e.g. 'Projects' or 'Archive/2026')",
      },
    },
    required: ["path"],
  },
};

export const CREATE_KANBAN_BOARD_TOOL: AgentToolDefinition = {
  name: "create_kanban_board",
  description:
    "Create an Obsidian-compatible Kanban board note with lanes and cards",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Vault path for the kanban note (e.g. 'Projects/SprintBoard.md')",
      },
      title: { type: "string", description: "Title of the board" },
      lanes: {
        type: "array",
        description: "List of lanes: [{ name: 'To Do', cards: ['Task 1'] }]",
      },
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
      position: {
        type: "string",
        enum: ["bottom", "top"],
        description: "Insert position (default: 'bottom')",
      },
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
  description:
    "Create a structured Markdown database note with typed columns and rows",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Vault path (e.g. 'Finance/Invoices.md')",
      },
      title: { type: "string", description: "Optional note heading title" },
      columns: {
        type: "array",
        description:
          "List of columns: { name: string, type: 'text' | 'number' | 'select' | 'checkbox' | 'date', options?: string[] }",
      },
      rows: {
        type: "array",
        description: "List of row records mapping column names to values",
      },
    },
    required: ["path"],
  },
};

export const CREATE_TODO_LIST_TOOL: AgentToolDefinition = {
  name: "create_todo_list",
  description:
    "Create a note with tasks and optional date/time reminder tokens",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Vault path (e.g. 'Daily/Todos.md')",
      },
      title: { type: "string", description: "Note title" },
      tasks: {
        type: "array",
        description:
          "List of task items: { text: string, done?: boolean, dueAtUtc?: string, recurrence?: string }",
      },
    },
    required: ["path", "tasks"],
  },
};

export const SAVE_MEMORY_TOOL: AgentToolDefinition = {
  name: "save_memory",
  description:
    "Store an important fact, user preference, project detail, or learned context into long-term memory",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description:
          "The fact, preference, or context to remember across conversations",
      },
      category: {
        type: "string",
        enum: ["preference", "fact", "project", "general"],
        description: "Category of the memory (default: general)",
      },
    },
    required: ["content"],
  },
};

export const VAULT_MUTATION_TOOLS: AgentToolDefinition[] = [
  CREATE_NOTE_TOOL,
  CREATE_FOLDER_TOOL,
  CREATE_KANBAN_BOARD_TOOL,
  EDIT_NOTE_TOOL,
  APPEND_TO_NOTE_TOOL,
  MOVE_NOTE_TOOL,
  DELETE_NOTE_TOOL,
  CREATE_DATABASE_TABLE_TOOL,
  CREATE_TODO_LIST_TOOL,
  SAVE_MEMORY_TOOL,
];
