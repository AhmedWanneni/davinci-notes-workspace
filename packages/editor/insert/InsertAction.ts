import { snippet } from "@codemirror/autocomplete";
import type { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { InsertItem } from "./InsertItem";

function blockPadding(document: string, from: number, to: number) {
  if (!document) return { before: "", after: "" };

  const before = document.slice(0, from);
  const after = document.slice(to);
  return {
    before:
      !before ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n",
    after:
      !after ? "" : after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n",
  };
}

/** Inserts an item at a selection captured before focus moved to the menu. */
export function insertItem(
  view: EditorView,
  item: InsertItem,
  selection: EditorSelection = view.state.selection,
  selectedText = view.state.doc.sliceString(selection.main.from, selection.main.to),
) {
  if (!view.state.facet(EditorView.editable)) return false;

  const range = selection.main;
  const result = item.build({ selectedText });
  const padding = result.block
    ? blockPadding(view.state.doc.toString(), range.from, range.to)
    : { before: "", after: "" };

  snippet(`${padding.before}${result.text}${padding.after}`)(
    view,
    null,
    range.from,
    range.to,
  );
  view.focus();
  return true;
}
