import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
} from "@codemirror/view";
import {
  mermaidCodeEditingField,
  setMermaidCodeEditing,
} from "./mermaidToolbarWidget";
import {
  MermaidBlock,
  MermaidExtensionOptions,
  MermaidWidget,
} from "./mermaidWidget";

export type { MermaidBlock, MermaidExtensionOptions };
export { mermaidCodeEditingField, setMermaidCodeEditing };

function mermaidSource(state: EditorState, from: number, to: number) {
  const lines = state.sliceDoc(from, to).split("\n");
  const last = lines.at(-1)?.trim() ?? "";
  const end = /^(?:`{3,}|~{3,})\s*$/.test(last) ? -1 : undefined;
  return lines.slice(1, end).join("\n");
}

export function findMermaidBlocks(state: EditorState): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name !== "FencedCode") return;
      const firstLine = state.doc.lineAt(node.from);
      const opening = /^(?:\s*)(`{3,}|~{3,})\s*([^\s`~]+)?/u.exec(
        firstLine.text,
      );
      if (!opening || opening[2]?.toLowerCase() !== "mermaid") return;
      blocks.push({
        from: node.from,
        to: node.to,
        source: mermaidSource(state, node.from, node.to),
        lineFrom: firstLine.number,
        lineTo: state.doc.lineAt(Math.max(node.from, node.to - 1)).number,
      });
    },
  });
  return blocks;
}

function buildMermaidDecorations(
  state: EditorState,
  options: MermaidExtensionOptions,
): DecorationSet {
  const blocks = findMermaidBlocks(state);
  const codeEditingFrom = state.field(mermaidCodeEditingField, false);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    if (!options.isReadOnly && codeEditingFrom === block.from) {
      continue;
    }

    const startLine = state.doc.lineAt(block.from);
    const endLine = state.doc.lineAt(Math.max(block.from, block.to - 1));
    const from = startLine.from;
    const to = endLine.to;

    decorations.push(
      Decoration.replace({
        widget: new MermaidWidget(block, options),
        block: true,
        inclusive: true,
      }).range(from, to),
    );
  }

  return Decoration.set(decorations, true);
}

export function mermaidExtension(options: MermaidExtensionOptions) {
  const decorationsField = StateField.define<DecorationSet>({
    create: (state) => buildMermaidDecorations(state, options),
    update: (value, tr) =>
      tr.docChanged ||
      tr.selection ||
      tr.effects.some((eff) => eff.is(setMermaidCodeEditing))
        ? buildMermaidDecorations(tr.state, options)
        : value,
    provide: (field) => EditorView.decorations.from(field),
  });

  return [mermaidCodeEditingField, decorationsField];
}

