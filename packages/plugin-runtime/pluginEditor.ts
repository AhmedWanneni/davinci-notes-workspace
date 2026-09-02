import type { PluginEditor } from "@app/plugin-api";
import type { PluginPermission } from "@app/plugin-api";
import { requirePluginPermission } from "./permissionGuard.js";

export interface PluginEditorAdapter extends PluginEditor {
  emitContentChange(content: string): void;
}

export class PluginEditorHost {
  private editor: PluginEditor | null = null;
  private readonly listeners = new Map<string, Set<() => void>>();

  setEditor(editor: PluginEditor | null): void {
    this.editor = editor;
  }

  createApi(
    pluginId: string,
    permissions: readonly PluginPermission[],
  ): PluginEditor {
    return {
      getContent: () => {
        requirePluginPermission(pluginId, permissions, "editor.getContent");
        return this.requireEditor().getContent();
      },
      setContent: (content) => {
        requirePluginPermission(pluginId, permissions, "editor.setContent");
        this.requireEditor().setContent(content);
      },
      getSelection: () => {
        requirePluginPermission(pluginId, permissions, "editor.getSelection");
        return this.requireEditor().getSelection();
      },
      setSelection: (selection) => {
        requirePluginPermission(pluginId, permissions, "editor.setSelection");
        this.requireEditor().setSelection(selection);
      },
      insertText: (text) => {
        requirePluginPermission(pluginId, permissions, "editor.insertText");
        this.requireEditor().insertText(text);
      },
      onContentChange: (listener) => {
        requirePluginPermission(
          pluginId,
          permissions,
          "editor.onContentChange",
        );
        const unsubscribe = this.requireEditor().onContentChange(listener);
        let owned = this.listeners.get(pluginId);
        if (!owned) {
          owned = new Set();
          this.listeners.set(pluginId, owned);
        }
        const release = () => {
          unsubscribe();
          owned?.delete(release);
        };
        owned.add(release);
        return release;
      },
    };
  }

  removePlugin(pluginId: string): void {
    for (const unsubscribe of this.listeners.get(pluginId) ?? []) unsubscribe();
    this.listeners.delete(pluginId);
  }

  private requireEditor(): PluginEditor {
    if (!this.editor) throw new Error("Editor API unavailable");
    return this.editor;
  }
}
