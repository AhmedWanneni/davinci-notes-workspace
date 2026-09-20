import type { EditorView } from "@codemirror/view";

export function wrapEditorSelection(
  view: EditorView,
  before: string,
  after = before,
) {
  const ranges = view.state.selection.ranges;
  const changes = ranges.map((range) => {
    const selected = view.state.sliceDoc(range.from, range.to);
    const wrapped = selected.startsWith(before) && selected.endsWith(after);
    return {
      from: range.from,
      to: range.to,
      insert: wrapped
        ? selected.slice(before.length, selected.length - after.length)
        : `${before}${selected}${after}`,
    };
  });
  view.dispatch({ changes });
}

function selectedLineNumbers(view: EditorView) {
  const lines = new Set<number>();
  for (const range of view.state.selection.ranges) {
    for (
      let number = view.state.doc.lineAt(range.from).number;
      number <= view.state.doc.lineAt(range.to).number;
      number++
    )
      lines.add(number);
  }
  return [...lines];
}

export function toggleHeading(view: EditorView, level: number) {
  const prefix = "#".repeat(level);
  const lines = selectedLineNumbers(view);
  const allCurrent = lines.every((number) =>
    new RegExp(`^${prefix}\\s`).test(view.state.doc.line(number).text),
  );
  view.dispatch({
    changes: lines.map((number) => {
      const line = view.state.doc.line(number);
      const text = line.text.replace(/^#{1,6}\s+/, "");
      return {
        from: line.from,
        to: line.to,
        insert: allCurrent ? text : `${prefix} ${text}`,
      };
    }),
  });
}

export function toggleLinePrefix(view: EditorView, prefix: string) {
  const lines = selectedLineNumbers(view);
  const allCurrent = lines.every((number) =>
    view.state.doc.line(number).text.startsWith(prefix),
  );
  view.dispatch({
    changes: lines.map((number, index) => {
      const line = view.state.doc.line(number);
      return {
        from: line.from,
        to: line.to,
        insert: allCurrent
          ? line.text.slice(prefix.length)
          : `${prefix === "1. " ? `${index + 1}. ` : prefix}${line.text}`,
      };
    }),
  });
}

export function insertEditorBlock(
  view: EditorView,
  block: string,
  caretOffset = block.length,
) {
  const range = view.state.selection.main;
  const line = view.state.doc.lineAt(range.to);
  const prefix = line.text.trim() ? "\n\n" : "";
  const suffix = "\n\n";
  const insert = `${prefix}${block}${suffix}`;
  view.dispatch({
    changes: { from: line.to, to: line.to, insert },
    selection: { anchor: line.to + prefix.length + caretOffset },
  });
}

export function insertHorizontalRule(view: EditorView) {
  insertEditorBlock(view, "---", 3);
}

export function insertDate(view: EditorView, date = new Date()) {
  insertEditorText(view, date.toISOString().slice(0, 10));
}

export function insertTime(view: EditorView, date = new Date()) {
  insertEditorText(
    view,
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  );
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
