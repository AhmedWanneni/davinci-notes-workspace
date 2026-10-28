import {
  EditorSelection,
  type Range,
  StateField,
  type EditorState,
  type StateCommand,
} from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";

class SoftLineBreakWidget extends WidgetType {
  eq(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = "cm-soft-line-break";
    element.textContent = " ";
    return element;
  }
}

const softLineBreak = Decoration.replace({
  widget: new SoftLineBreakWidget(),
});

function hasTrailingHardBreak(line: string): boolean {
  return / {2,}$/.test(line);
}

function addSoftLineBreaks(
  state: EditorState,
  from: number,
  to: number,
  decorations: Range<Decoration>[],
): void {
  const tree = syntaxTree(state);
  const firstLine = state.doc.lineAt(from);
  const lastLine = state.doc.lineAt(to);

  for (
    let lineNumber = firstLine.number;
    lineNumber <= lastLine.number;
    lineNumber++
  ) {
    const line = state.doc.line(lineNumber);
    if (
      line.to < state.doc.length &&
      !hasTrailingHardBreak(line.text) &&
      !line.text.trim().startsWith("|") &&
      isParagraphBreak(tree, line.to)
    ) {
      decorations.push(softLineBreak.range(line.to, line.to + 1));
    }
  }
}

function isParagraphBreak(
  tree: ReturnType<typeof syntaxTree>,
  position: number,
): boolean {
  let node: SyntaxNode | null = tree.resolveInner(position, -1);
  while (node) {
    if (
      node.name === "Table" ||
      node.name === "TableHeader" ||
      node.name === "TableRow" ||
      node.name === "TableCell" ||
      node.name === "TableDelimiter"
    ) {
      return false;
    }
    if (node.name === "Paragraph") return node.to > position;
    node = node.parent;
  }
  return false;
}

function buildSoftLineBreaks(state: EditorState): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  addSoftLineBreaks(state, 0, state.doc.length, decorations);
  return Decoration.set(decorations, true);
}

function changedParagraphRange(state: EditorState, from: number, to: number) {
  const firstLine = state.doc.lineAt(Math.max(0, from - 1));
  const lastLine = state.doc.lineAt(Math.min(state.doc.length, to + 1));
  return { from: firstLine.from, to: lastLine.to };
}

/** Render CommonMark soft paragraph newlines as a space without changing text. */
export const softLineBreakExtension = StateField.define<DecorationSet>({
  create: buildSoftLineBreaks,
  update(value, transaction) {
    if (!transaction.docChanged) return value;

    let from = transaction.state.doc.length;
    let to = 0;
    transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
      const range = changedParagraphRange(transaction.state, fromB, toB);
      from = Math.min(from, range.from);
      to = Math.max(to, range.to);
    });

    const decorations: Range<Decoration>[] = [];
    addSoftLineBreaks(transaction.state, from, to, decorations);
    return value.map(transaction.changes).update({
      filterFrom: from,
      filterTo: to,
      filter: () => false,
      add: decorations,
    });
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** Insert the Markdown two-space sequence required for a hard line break. */
export const insertHardLineBreak: StateCommand = ({ state, dispatch }) => {
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const orderedList = /^(\s*)(\d+[.)])([ \t]+)/.exec(line.text);
    const continuationIndent = orderedList
      ? " ".repeat(
          orderedList[1].length + orderedList[2].length + orderedList[3].length,
        )
      : "";
    const insert = `  \n${continuationIndent}`;
    return {
      range: EditorSelection.cursor(range.from + insert.length),
      changes: { from: range.from, to: range.to, insert },
    };
  });

  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};
