import type { EditorView } from "@codemirror/view";

export interface EditorSelection {
  from: number;
  to: number;
}

export interface EditorPluginAdapter {
  getContent(): string;
  setContent(content: string): void;
  getSelection(): EditorSelection;
  setSelection(selection: EditorSelection): void;
  insertText(text: string): void;
  onContentChange(listener: (content: string) => void): () => void;
  onChange(listener: () => void): () => void;
  emitContentChange(content: string): void;
  emitChange(): void;
  destroy(): void;
}

export function createEditorPluginAdapter(
  view: EditorView,
): EditorPluginAdapter {
  const listeners = new Set<(content: string) => void>();
  const changeListeners = new Set<() => void>();
  return {
    getContent: () => view.state.doc.toString(),
    setContent: (content) =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      }),
    getSelection: () => ({
      from: view.state.selection.main.from,
      to: view.state.selection.main.to,
    }),
    setSelection: (selection: EditorSelection) =>
      view.dispatch({
        selection: { anchor: selection.from, head: selection.to },
      }),
    insertText: (text) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
    },
    onContentChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onChange: (listener) => {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    emitContentChange: (content) =>
      listeners.forEach((listener) => listener(content)),
    emitChange: () => changeListeners.forEach((listener) => listener()),
    destroy: () => { listeners.clear(); changeListeners.clear(); },
  };
}
