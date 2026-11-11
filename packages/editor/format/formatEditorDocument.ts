import { undo } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";
import { formatMarkdown } from "./formatMarkdown";
import { minimalDocumentChange } from "../integration/externalDocumentChange";

export interface FormatEditorOptions {
  selectionOnly?: boolean;
}

export interface FormatEditorResult {
  changed: boolean;
  isSelection: boolean;
  undo: () => void;
}

export function formatEditorDocument(
  view: EditorView,
  options: FormatEditorOptions = {},
): FormatEditorResult {
  const state = view.state;
  const selection = state.selection.main;
  const hasTextSelection = selection.from !== selection.to;
  const isSelection = Boolean(options.selectionOnly && hasTextSelection);

  if (isSelection) {
    const startLine = state.doc.lineAt(selection.from);
    const endLine = state.doc.lineAt(selection.to);
    const rangeFrom = startLine.from;
    const rangeTo = endLine.to;

    const originalSlice = state.doc.sliceString(rangeFrom, rangeTo);
    const result = formatMarkdown(originalSlice, { insertFinalNewline: false });

    if (!result.changed || result.formatted === originalSlice) {
      return { changed: false, isSelection: true, undo: () => {} };
    }

    const diff = minimalDocumentChange(originalSlice, result.formatted);
    view.dispatch({
      changes: {
        from: rangeFrom + diff.from,
        to: rangeFrom + diff.to,
        insert: diff.insert,
      },
      userEvent: "format",
      scrollIntoView: false,
    });

    return {
      changed: true,
      isSelection: true,
      undo: () => undo(view),
    };
  }

  const originalDoc = state.doc.toString();
  const result = formatMarkdown(originalDoc, { insertFinalNewline: true });

  if (!result.changed || result.formatted === originalDoc) {
    return { changed: false, isSelection: false, undo: () => {} };
  }

  const diff = minimalDocumentChange(originalDoc, result.formatted);
  view.dispatch({
    changes: {
      from: diff.from,
      to: diff.to,
      insert: diff.insert,
    },
    userEvent: "format",
    scrollIntoView: false,
  });

  return {
    changed: true,
    isSelection: false,
    undo: () => undo(view),
  };
}
