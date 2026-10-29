import type { RegisteredPluginCommand } from "@app/plugin-runtime";
import { insertRegistry } from "@app/editor";

export interface PaletteTarget {
  path?: string;
  title: string;
  recencyScore: number;
  isCommand?: boolean;
  id?: string;
}

export interface BuildPaletteCommandsOptions {
  allNotePaths: readonly string[];
  openNotes: readonly string[];
  useVimMode: boolean;
  pluginCommands: readonly RegisteredPluginCommand[];
  isEditableEditor: boolean;
  recentInsertIds?: readonly string[];
  hasActiveNote?: boolean;
  isBookmarked?: boolean;
}

export function buildPaletteCommands({
  allNotePaths,
  openNotes,
  useVimMode,
  pluginCommands,
  isEditableEditor,
  recentInsertIds = [],
  hasActiveNote,
  isBookmarked,
}: BuildPaletteCommandsOptions): PaletteTarget[] {
  const targets: PaletteTarget[] = allNotePaths.map((path) => {
    const title = path.replace(/\.md$/i, "").split(/[/\\]/).pop() ?? path;
    const recencyScore = openNotes.includes(path) ? 1000 : 0;
    return { path, title, recencyScore };
  });

  if (useVimMode) {
    targets.push({
      isCommand: true,
      id: "action:disable-vim",
      title: "Disable Vim keybindings",
      recencyScore: 600,
    });
  }

  if (hasActiveNote) {
    targets.push({
      isCommand: true,
      id: "action:toggle-bookmark",
      title: isBookmarked
        ? "Remove bookmark from current note"
        : "Bookmark current note",
      recencyScore: 550,
    });
  }

  targets.push({
    isCommand: true,
    id: "action:open-bookmarks",
    title: "Open Bookmarks",
    recencyScore: 420,
  });

  targets.push({
    isCommand: true,
    id: "action:settings",
    title: "Open Settings",
    recencyScore: 500,
  });

  targets.push({
    isCommand: true,
    id: "action:logs",
    title: "Open Logs",
    recencyScore: 450,
  });

  targets.push({
    isCommand: true,
    id: "action:tags",
    title: "Browse Tags",
    recencyScore: 400,
  });

  targets.push({
    isCommand: true,
    id: "action:open-ai-listening",
    title: "Open AI Listening",
    recencyScore: 430,
  });

  targets.push({
    isCommand: true,
    id: "action:start-meeting-recording",
    title: "Start Meeting Recording",
    recencyScore: 425,
  });

  targets.push({
    isCommand: true,
    id: "action:stop-meeting-recording",
    title: "Stop Meeting Recording",
    recencyScore: 425,
  });

  targets.push({
    isCommand: true,
    id: "action:reminders",
    title: "Browse Reminders",
    recencyScore: 380,
  });

  targets.push({
    isCommand: true,
    id: "action:save-version",
    title: "Save version now",
    recencyScore: 350,
  });

  targets.push({
    isCommand: true,
    id: "action:drive-sign-in",
    title: "Sign in to Drive",
    recencyScore: 300,
  });

  targets.push({
    isCommand: true,
    id: "action:drive-disconnect",
    title: "Disconnect Drive",
    recencyScore: 290,
  });

  targets.push({
    isCommand: true,
    id: "action:drive-refresh",
    title: "Refresh Drive Session",
    recencyScore: 280,
  });

  for (const command of pluginCommands) {
    targets.push({
      isCommand: true,
      id: `plugin:${command.id}`,
      title: command.title,
      recencyScore: 200,
    });
  }

  if (isEditableEditor) {
    for (const item of insertRegistry) {
      const isRecent = recentInsertIds.includes(item.id);
      targets.push({
        isCommand: true,
        id: `insert:${item.id}`,
        title: `Insert: ${item.label}`,
        recencyScore: isRecent ? 450 : 250,
      });
    }
  }

  return targets;
}
