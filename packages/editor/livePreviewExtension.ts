import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

const syntaxDeco = Decoration.mark({ class: "cm-markdown-syntax" });
const hrLineDeco = Decoration.line({ class: "cm-hr-line" });
const codeLineDeco = Decoration.line({ class: "cm-code-block" });

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
          node.name === "EmphasisMark" ||
          node.name === "EmphasisSymbol" ||
          node.name === "StrikethroughMark" ||
          node.name === "HighlightMark" ||
          node.name === "HeaderMark" ||
          node.name === "LinkMark" ||
          node.name === "QuoteMark"
        ) {
          builder.push(syntaxDeco.range(node.from, node.to));
        } else if (node.name === "CodeMark" || node.name === "CodeInfo") {
          builder.push(syntaxDeco.range(node.from, node.to));
        } else if (node.name === "FencedCode" || node.name === "CodeBlock") {
          for (
            let line = state.doc.lineAt(node.from);
            line.from < node.to;
            line = state.doc.line(line.number + 1)
          ) {
            builder.push(codeLineDeco.range(line.from));
            if (line.to >= node.to) break;
          }
        } else if (node.name === "Escape") {
          // Hide backslash in live preview while leaving escaped character visible
          builder.push(syntaxDeco.range(node.from, node.from + 1));
        } else if (node.name === "HorizontalRule") {
          const line = state.doc.lineAt(node.from);
          builder.push(hrLineDeco.range(line.from));
          builder.push(syntaxDeco.range(node.from, node.to));
        }
      },
    });
  }

  // Sort ranges by start position (CodeMirror requirement)
  builder.sort((a, b) => a.from - b.from);
  return Decoration.set(builder, true);
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
