import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { MermaidCodeHeaderWidget } from "./mermaidToolbarWidget";
import {
  MermaidBlock,
  MermaidContinuationWidget,
  MermaidExtensionOptions,
  MermaidWidget,
} from "./mermaidWidget";

export type { MermaidBlock, MermaidExtensionOptions };

export const setMermaidCodeEditing = StateEffect.define<number | null>();

export const mermaidCodeEditingField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setMermaidCodeEditing)) return effect.value;
    }
    return value;
  },
});

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

function getMermaidDecorations(
  view: EditorView,
  options: MermaidExtensionOptions,
): DecorationSet {
  const blocks = findMermaidBlocks(view.state);
  const codeEditingFrom = view.state.field(mermaidCodeEditingField, false);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    if (!options.isReadOnly && codeEditingFrom === block.from) {
      decorations.push(
        Decoration.widget({
          widget: new MermaidCodeHeaderWidget(() => {
            view.dispatch({ effects: setMermaidCodeEditing.of(null) });
          }),
          side: -1,
        }).range(block.from),
      );
      continue;
    }

    for (let lineNum = block.lineFrom; lineNum <= block.lineTo; lineNum++) {
      const line = view.state.doc.line(lineNum);
      if (line.from === line.to) continue;
      decorations.push(
        Decoration.replace({
          widget:
            lineNum === block.lineFrom
              ? new MermaidWidget(block, view, options, (from) => {
                  view.dispatch({ effects: setMermaidCodeEditing.of(from) });
                })
              : new MermaidContinuationWidget(),
        }).range(line.from, line.to),
      );
    }
  }
  return Decoration.set(decorations);
}

export function mermaidExtension(options: MermaidExtensionOptions) {
  return [
    mermaidCodeEditingField,
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(readonly view: EditorView) {
          this.decorations = getMermaidDecorations(view, options);
        }
        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.selectionSet ||
            update.transactions.some((tr) =>
              tr.effects.some((eff) => eff.is(setMermaidCodeEditing)),
            )
          ) {
            this.decorations = getMermaidDecorations(update.view, options);
          }
        }
      },
      { decorations: (v) => v.decorations },
    ),
  ];
}
