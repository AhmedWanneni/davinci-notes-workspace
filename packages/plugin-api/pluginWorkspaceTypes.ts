export interface PluginSelection {
  from: number;
  to: number;
}

export interface PluginEditor {
  getContent(): string;
  setContent(content: string): void;
  getSelection(): PluginSelection;
  setSelection(selection: PluginSelection): void;
  insertText(text: string): void;
  onContentChange(listener: (content: string) => void): () => void;
}

export interface PluginDom {
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: { text?: string; cls?: string; attr?: Record<string, string> },
  ): HTMLElementTagNameMap[K];
  createText(text: string): Text;
}

export interface PluginViewContext {
  container: HTMLElement;
  dom: PluginDom;
}

export interface PluginView {
  id: string;
  name: string;
  render: (context: PluginViewContext) => void | (() => void);
}

export interface PluginWorkspace {
  registerView(view: PluginView): () => void;
  openLeaf(viewId: string): void;
  closeLeaf(): void;
  focusLeaf(): void;
  isViewOpen(viewId?: string): boolean;
}
