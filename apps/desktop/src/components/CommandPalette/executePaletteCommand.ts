import type { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { insertRegistry, runInsertItem } from "@app/editor";
import type { RegisteredPluginCommand } from "@app/plugin-runtime";

export interface ExecutePaletteCommandOptions {
  id?: string;
  setUseVimMode: (enabled: boolean) => Promise<void> | void;
  onOpenSettings?: () => void;
  onOpenLogs?: () => void;
  onOpenTags?: () => void;
  onOpenReminders?: () => void;
  onSaveVersionNow?: () => void;
  onToggleBookmark?: () => void;
  onOpenBookmarks?: () => void;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  editorView?: EditorView | null;
  editorSelection: EditorSelection | null;
  onInsertSuccess?: (itemId: string) => void;
  pluginCommands?: RegisteredPluginCommand[];
  onInvokePluginCommand?: (id: string) => void;
}

export function executePaletteCommand({
  id,
  setUseVimMode,
  onOpenSettings,
  onOpenLogs,
  onOpenTags,
  onOpenReminders,
  onSaveVersionNow,
  onToggleBookmark,
  onOpenBookmarks,
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  editorView,
  editorSelection,
  onInsertSuccess,
  pluginCommands = [],
  onInvokePluginCommand,
}: ExecutePaletteCommandOptions) {
  if (!id) return;
  if (id === "action:disable-vim") void setUseVimMode(false);
  if (id === "action:settings") onOpenSettings?.();
  if (id === "action:logs") onOpenLogs?.();
  if (id === "action:tags") onOpenTags?.();
  if (id === "action:reminders") onOpenReminders?.();
  if (id === "action:save-version") onSaveVersionNow?.();
  if (id === "action:toggle-bookmark") onToggleBookmark?.();
  if (id === "action:open-bookmarks") onOpenBookmarks?.();
  if (id === "action:drive-sign-in") onDriveSignIn?.();
  if (id === "action:drive-disconnect") onDriveDisconnect?.();
  if (id === "action:drive-refresh") onDriveRefresh?.();
  if (id.startsWith("insert:")) {
    const itemId = id.slice(7);
    const item = insertRegistry.find((entry) => entry.id === itemId);
    if (item && editorView && editorView.state.facet(EditorView.editable)) {
      const selection = editorSelection ?? editorView.state.selection;
      runInsertItem(editorView, item, selection);
      onInsertSuccess?.(item.id);
      editorView.focus();
    }
  }
  const pluginId = id.startsWith("plugin:") ? id.slice(7) : undefined;
  const command = pluginCommands.find((item) => item.id === pluginId);
  if (command) onInvokePluginCommand?.(command.id);
}
