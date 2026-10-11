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
}

export function buildPaletteCommands({
  allNotePaths,
  openNotes,
  useVimMode,
  pluginCommands,
  isEditableEditor,
  recentInsertIds = [],
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

  targets.push({
    isCommand: true,
    id: "action:settings",
    title: "Open Settings",
    recencyScore: 500,
  });

  targets.push({
    isCommand: true,
    id: "action:tags",
    title: "Browse Tags",
    recencyScore: 400,
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
