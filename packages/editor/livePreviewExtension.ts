import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

const syntaxDeco = Decoration.mark({ class: "cm-markdown-syntax" });

function getLivePreviewDecos(view: EditorView): DecorationSet {
  const builder: Range<Decoration>[] = [];
  const state = view.state;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
        // Highlight markdown syntax symbols/delimiters to allow hiding them
        if (
          node.name === "EmphasisSymbol" ||
          node.name === "HeaderMark" ||
          node.name === "ListMark" ||
          node.name === "LinkMark"
        ) {
          builder.push(syntaxDeco.range(node.from, node.to));
        }
      },
    });
  }

  // Sort ranges by start position (CodeMirror requirement)
  builder.sort((a, b) => a.from - b.from);
  return Decoration.set(builder);
}

export const livePreviewExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getLivePreviewDecos(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = getLivePreviewDecos(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);
