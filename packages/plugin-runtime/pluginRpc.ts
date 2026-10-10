export interface PluginRpcTransport {
  request(
    method: string,
    params?: unknown,
  ): Promise<unknown>;
  setEditor?(editor: PluginEditorHostAdapter | null): void;
  removePlugin?(pluginId: string): void;
  registerPlugin?(pluginId: string, permissions: readonly import("@app/plugin-api").PluginPermission[]): string;
  unregisterPlugin?(pluginId: string): void;
}

/** Synchronous CodeMirror adapter retained only inside the host webview. */
export interface PluginEditorHostAdapter {
  getContent(): string;
  setContent(content: string): void;
  getSelection(): { from: number; to: number };
  setSelection(selection: { from: number; to: number }): void;
  insertText(text: string): void;
  onChange(listener: () => void): () => void;
}

export interface PluginLoadResult {
  commands?: Array<{ id: string; title: string; hotkey?: string }>;
  views?: Array<{ id: string; name: string; model: unknown; open?: boolean }>;
}

export function isPluginLoadResult(value: unknown): value is PluginLoadResult {
  if (!value || typeof value !== "object") return false;
  const { commands, views } = value as PluginLoadResult;
  return (
    commands === undefined ||
    (Array.isArray(commands) &&
      commands.every(
        (command) =>
          command &&
          typeof command.id === "string" &&
          typeof command.title === "string",
      )) &&
    (views === undefined ||
      (Array.isArray(views) && views.every((view) =>
        view && typeof view.id === "string" && typeof view.name === "string",
      )))
  );
}
