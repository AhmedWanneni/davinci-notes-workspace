export interface AgentShortcut {
  id: string;
  title: string;
  prompt: string;
  description?: string;
  icon?: string;
}

export interface ShortcutsData {
  version: number;
  shortcuts: AgentShortcut[];
}

export const SHORTCUTS_FILE_PATH = ".davinci/agent/shortcuts.json";
export const SHORTCUTS_VERSION = 1;

export const DEFAULT_STARTER_SHORTCUTS: AgentShortcut[] = [
  {
    id: "weekly-review",
    title: "Weekly Review",
    description: "Summarize notes and extract action items",
    prompt: "Review my notes from this week, generate a summary of accomplishments, and list open action items.",
  },
  {
    id: "extract-tasks",
    title: "Extract Action Items",
    description: "Scan notes for open tasks with reminders",
    prompt: "Scan recent notes, find all uncompleted tasks, and format them into a clean to-do list with due dates.",
  },
  {
    id: "organize-folder",
    title: "Organize Notes",
    description: "Review notes and organize them by topic",
    prompt: "Look at my unorganized notes in the vault and suggest organizing them into topic folders with proper names.",
  },
  {
    id: "create-database",
    title: "Create Database Table",
    description: "Generate a markdown database table",
    prompt: "Create a new database table in 'Projects/' to track project milestones, status, and deadlines.",
  },
];

export function parseShortcuts(rawJson?: string | null): ShortcutsData {
  if (!rawJson || typeof rawJson !== "string") {
    return { version: SHORTCUTS_VERSION, shortcuts: DEFAULT_STARTER_SHORTCUTS };
  }

  try {
    const parsed = JSON.parse(rawJson) as Partial<ShortcutsData>;
    if (parsed.version !== SHORTCUTS_VERSION || !Array.isArray(parsed.shortcuts)) {
      return { version: SHORTCUTS_VERSION, shortcuts: DEFAULT_STARTER_SHORTCUTS };
    }
    const valid = parsed.shortcuts.filter(
      (s): s is AgentShortcut =>
        typeof s.id === "string" && typeof s.title === "string" && typeof s.prompt === "string",
    );
    return {
      version: SHORTCUTS_VERSION,
      shortcuts: valid.length > 0 ? valid : DEFAULT_STARTER_SHORTCUTS,
    };
  } catch {
    return { version: SHORTCUTS_VERSION, shortcuts: DEFAULT_STARTER_SHORTCUTS };
  }
}

export function serializeShortcuts(data: ShortcutsData): string {
  return JSON.stringify(data, null, 2);
}

export function applyShortcutTemplate(
  promptTemplate: string,
  variables: Record<string, string | undefined>,
): string {
  let result = promptTemplate;
  for (const [key, val] of Object.entries(variables)) {
    if (val !== undefined) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
    }
  }
  return result;
}
