import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import type { WidgetBlock } from "./widgetTypes";
import { WidgetBlockWidget } from "./widgetWidget";

function extractWidgetSource(
  state: EditorState,
  from: number,
  to: number,
): string {
  const lines = state.sliceDoc(from, to).split("\n");
  const last = lines.at(-1)?.trim() ?? "";
  const end = /^(?:`{3,}|~{3,})\s*$/.test(last) ? -1 : undefined;
  return lines.slice(1, end).join("\n");
}

export function findWidgetBlocks(state: EditorState): WidgetBlock[] {
  const blocks: WidgetBlock[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name !== "FencedCode") return;
      const firstLine = state.doc.lineAt(node.from);
      const opening = /^(?:\s*)(`{3,}|~{3,})\s*([^\s`~]+)?/u.exec(
        firstLine.text,
      );
      if (!opening || opening[2]?.toLowerCase() !== "widget") return;
      blocks.push({
        from: node.from,
        to: node.to,
        source: extractWidgetSource(state, node.from, node.to),
        lineFrom: firstLine.number,
        lineTo: state.doc.lineAt(Math.max(node.from, node.to - 1)).number,
      });
    },
  });
  return blocks;
}

function buildWidgetDecorations(state: EditorState): DecorationSet {
  const blocks = findWidgetBlocks(state);
  if (blocks.length === 0) {
    return Decoration.none;
  }

  const cursor = state.selection.main.head;
  const editable = state.facet(EditorView.editable);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    // If editor is editable and cursor is inside the block boundary, reveal raw markdown source
    if (editable && cursor >= block.from && cursor <= block.to) {
      continue;
    }

    const startLine = state.doc.lineAt(block.from);
    const endLine = state.doc.lineAt(Math.max(block.from, block.to - 1));
    const from = startLine.from;
    const to = endLine.to;

    decorations.push(
      Decoration.replace({
        widget: new WidgetBlockWidget(block),
        block: true,
        inclusive: true,
      }).range(from, to),
    );
  }

  return Decoration.set(decorations, true);
}

export const widgetDecorationsField = StateField.define<DecorationSet>({
  create: (state) => buildWidgetDecorations(state),
  update: (value, tr) =>
    tr.docChanged || tr.selection ? buildWidgetDecorations(tr.state) : value,
  provide: (field) => EditorView.decorations.from(field),
});

export function widgetExtension() {
  return widgetDecorationsField;
}
