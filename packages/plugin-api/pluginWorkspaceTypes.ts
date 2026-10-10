export interface PluginSelection {
  from: number;
  to: number;
}

export interface PluginEditorSnapshot {
  content: string;
  selection: PluginSelection;
  version: number;
}

export interface PluginEditor {
  getContent(): Promise<PluginEditorSnapshot>;
  setContent(content: string, expectedVersion?: number): Promise<PluginEditorSnapshot>;
  getSelection(): Promise<PluginEditorSnapshot>;
  setSelection(selection: PluginSelection, expectedVersion?: number): Promise<PluginEditorSnapshot>;
  insertText(text: string, expectedVersion?: number): Promise<PluginEditorSnapshot>;
  subscribe(listener: (snapshot: PluginEditorSnapshot) => void): Promise<() => void>;
}

export type PluginViewModel =
  | { type: "stack"; children: PluginViewModel[] }
  | { type: "text"; text: string }
  | { type: "button"; id: string; label: string; disabled?: boolean }
  | { type: "input"; id: string; value: string; placeholder?: string };

export type PluginViewEvent =
  | { type: "click"; targetId: string }
  | { type: "input"; targetId: string; value: string };

export interface PluginView {
  id: string;
  name: string;
  render(): PluginViewModel;
  onEvent?(event: PluginViewEvent): void | PluginViewModel | Promise<void | PluginViewModel>;
}

export interface PluginWorkspace {
  registerView(view: PluginView): () => void;
  openLeaf(viewId: string): void;
  closeLeaf(): void;
  focusLeaf(): void;
  isViewOpen(viewId?: string): boolean;
}

export function isPluginViewModel(value: unknown): value is PluginViewModel {
  if (!value || typeof value !== "object") return false;
  const model = value as Record<string, unknown>;
  if (model.type === "stack") {
    return Array.isArray(model.children) && model.children.every(isPluginViewModel);
  }
  if (model.type === "text") return typeof model.text === "string";
  if (model.type === "button") {
    return typeof model.id === "string" && typeof model.label === "string" &&
      (model.disabled === undefined || typeof model.disabled === "boolean");
  }
  if (model.type === "input") {
    return typeof model.id === "string" && typeof model.value === "string" &&
      (model.placeholder === undefined || typeof model.placeholder === "string");
  }
  return false;
}
