import type { EditorView } from "@codemirror/view";

export function wrapEditorSelection(
  view: EditorView,
  before: string,
  after = before,
) {
  const ranges = view.state.selection.ranges;
  const changes = ranges.map((range) => ({
    from: range.from,
    to: range.to,
    insert: `${before}${view.state.sliceDoc(range.from, range.to)}${after}`,
  }));
  view.dispatch({ changes });
}

export function prefixEditorLines(view: EditorView, prefix: string) {
  const lines = new Set<number>();
  for (const range of view.state.selection.ranges) {
    for (
      let number = view.state.doc.lineAt(range.from).number;
      number <= view.state.doc.lineAt(range.to).number;
      number++
    )
      lines.add(number);
  }
  view.dispatch({
    changes: [...lines].map((number) => ({
      from: view.state.doc.line(number).from,
      insert: prefix,
    })),
  });
}

export function insertEditorText(view: EditorView, text: string) {
  const range = view.state.selection.main;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: text },
    selection: { anchor: range.from + text.length },
  });
}
