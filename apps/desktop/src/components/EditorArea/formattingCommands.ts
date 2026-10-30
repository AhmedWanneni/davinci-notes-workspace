import type { EditorView } from "@codemirror/view";
import { undo, redo } from "@app/editor";
import {
  wrapEditorSelection,
  toggleHeading,
  toggleLinePrefix,
  insertEditorBlock,
  insertHorizontalRule,
  insertEditorText,
} from "./editorInsertCommands";

export function handleUndo(view: EditorView): boolean {
  return undo(view);
}

export function handleRedo(view: EditorView): boolean {
  return redo(view);
}

export function handleBold(view: EditorView): void {
  wrapEditorSelection(view, "**");
}

export function handleItalic(view: EditorView): void {
  wrapEditorSelection(view, "*");
}

export function handleUnderline(view: EditorView): void {
  wrapEditorSelection(view, "<u>", "</u>");
}

export function handleStrikethrough(view: EditorView): void {
  wrapEditorSelection(view, "~~");
}

export function handleHighlight(view: EditorView): void {
  wrapEditorSelection(view, "==");
}

export function handleInlineCode(view: EditorView): void {
  wrapEditorSelection(view, "`");
}

export function handleHeadingChange(view: EditorView, level: number): void {
  if (level === 0) {
    // Clear heading on selected lines
    const lines = new Set<number>();
    for (const range of view.state.selection.ranges) {
      for (
        let n = view.state.doc.lineAt(range.from).number;
        n <= view.state.doc.lineAt(range.to).number;
        n++
      ) {
        lines.add(n);
      }
    }
    view.dispatch({
      changes: [...lines].map((number) => {
        const line = view.state.doc.line(number);
        return {
          from: line.from,
          to: line.to,
          insert: line.text.replace(/^#{1,6}\s+/, ""),
        };
      }),
    });
  } else {
    toggleHeading(view, level);
  }
}

export function handleBulletList(view: EditorView): void {
  toggleLinePrefix(view, "- ");
}

export function handleNumberedList(view: EditorView): void {
  toggleLinePrefix(view, "1. ");
}

export function handleTaskList(view: EditorView): void {
  toggleLinePrefix(view, "- [ ] ");
}

export function handleQuote(view: EditorView): void {
  toggleLinePrefix(view, "> ");
}

export function handleDivider(view: EditorView): void {
  insertHorizontalRule(view);
}

export function handleLink(view: EditorView): void {
  const range = view.state.selection.main;
  const selected = view.state.sliceDoc(range.from, range.to);
  if (selected) {
    wrapEditorSelection(view, "[", "](url)");
  } else {
    insertEditorText(view, "[](url)");
  }
}

export function handleTable(view: EditorView): void {
  const table =
    "| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |";
  insertEditorBlock(view, table, table.length);
}

export function handleCodeBlock(view: EditorView): void {
  const codeBlock = "```\n\n```";
  insertEditorBlock(view, codeBlock, 4);
}
