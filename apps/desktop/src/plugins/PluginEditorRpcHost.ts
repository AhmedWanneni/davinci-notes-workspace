import type { PluginEditorHostAdapter } from "@app/plugin-runtime";

const EDITOR_CHANGE_DEBOUNCE_MS = 100;

interface EditorSnapshot {
  content: string;
  selection: { from: number; to: number };
  version: number;
}

export class PluginEditorRpcHost {
  private editor: PluginEditorHostAdapter | null = null;
  private unsubscribeEditor: (() => void) | null = null;
  private readonly subscriptions = new Map<string, string>();
  private version = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly notify: (method: string, params: unknown) => Promise<void>,
  ) {}

  setEditor(editor: PluginEditorHostAdapter | null): void {
    this.unsubscribeEditor?.();
    this.unsubscribeEditor = null;
    this.editor = editor;
    this.version += 1;
    if (editor) this.unsubscribeEditor = editor.onChange(() => this.changed());
    this.scheduleNotification();
  }

  removePlugin(pluginId: string): void {
    for (const [subscriptionId, owner] of this.subscriptions) {
      if (owner === pluginId) this.subscriptions.delete(subscriptionId);
    }
  }

  dispose(): void {
    this.unsubscribeEditor?.();
    this.unsubscribeEditor = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.subscriptions.clear();
    this.editor = null;
  }

  async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.pluginId(params);
    switch (method) {
      case "editor.getContent":
      case "editor.getSelection": return this.snapshot();
      case "editor.setContent":
        this.assertVersion(params.expectedVersion);
        this.requireEditor().setContent(String(params.content ?? ""));
        return this.snapshot();
      case "editor.setSelection":
        this.assertVersion(params.expectedVersion);
        this.requireEditor().setSelection(this.selection(params.selection));
        return this.snapshot();
      case "editor.insertText":
        this.assertVersion(params.expectedVersion);
        this.requireEditor().insertText(String(params.text ?? ""));
        return this.snapshot();
      case "editor.subscribe": {
        const subscriptionId = String(params.subscriptionId ?? "");
        if (!subscriptionId) throw new Error("editor.subscribe requires subscriptionId");
        this.subscriptions.set(subscriptionId, id);
        return null;
      }
      case "editor.unsubscribe":
        this.subscriptions.delete(String(params.subscriptionId ?? ""));
        return null;
      default: throw new Error(`Unknown editor host method: ${method}`);
    }
  }

  private changed(): void { this.version += 1; this.scheduleNotification(); }

  private scheduleNotification(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flushNotifications();
    }, EDITOR_CHANGE_DEBOUNCE_MS);
  }

  private async flushNotifications(): Promise<void> {
    if (!this.editor || this.subscriptions.size === 0) return;
    const snapshot = this.snapshot();
    await Promise.all([...this.subscriptions].map(([subscriptionId, id]) =>
      this.notify("editor.changed", { id, subscriptionId, snapshot }),
    ));
  }

  private snapshot(): EditorSnapshot {
    const editor = this.requireEditor();
    return { content: editor.getContent(), selection: editor.getSelection(), version: this.version };
  }

  private assertVersion(value: unknown): void {
    if (value !== undefined && value !== this.version) {
      throw new Error(`Editor version conflict: expected ${value}, current ${this.version}`);
    }
  }

  private selection(value: unknown): { from: number; to: number } {
    const selection = value as { from?: unknown; to?: unknown };
    if (!Number.isInteger(selection?.from) || !Number.isInteger(selection?.to)) {
      throw new Error("editor.setSelection requires integer from and to");
    }
    return { from: selection.from as number, to: selection.to as number };
  }

  private pluginId(params: Record<string, unknown>): string {
    const id = String(params.id ?? "");
    if (!id) throw new Error("Editor request requires plugin id");
    return id;
  }

  private requireEditor(): PluginEditorHostAdapter {
    if (!this.editor) throw new Error("Editor API unavailable");
    return this.editor;
  }
}
