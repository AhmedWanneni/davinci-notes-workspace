import { syntaxTree } from "@codemirror/language";
import { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

const markerHiddenDeco = Decoration.mark({
  class: "cm-markdown-syntax cm-marker-hidden",
});
const markerActiveDeco = Decoration.mark({
  class: "cm-markdown-syntax cm-marker-active",
});
const hrLineDeco = Decoration.line({ class: "cm-hr-line" });
const codeLineDeco = Decoration.line({ class: "cm-code-block" });

const WIKILINK_REGEX = /\[\[([^\n\]]+)\]\]/g;
const VIEWPORT_MARGIN = 1000;

function isRangeSelected(
  selection: EditorView["state"]["selection"],
  from: number,
  to: number,
): boolean {
  for (const range of selection.ranges) {
    if (Math.max(range.from, from) <= Math.min(range.to, to)) {
      return true;
    }
  }
  return false;
}

function getLivePreviewDecos(view: EditorView): DecorationSet {
  const builder: Range<Decoration>[] = [];
  const state = view.state;
  const isEditable = state.facet(EditorView.editable);

  for (const range of view.visibleRanges) {
    const from = Math.max(0, range.from - VIEWPORT_MARGIN);
    const to = Math.min(state.doc.length, range.to + VIEWPORT_MARGIN);

    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
        let parentFrom = node.from;
        let parentTo = node.to;

        if (node.name === "HeaderMark") {
          const parent = node.node.parent;
          if (parent) {
            parentFrom = parent.from;
            parentTo = parent.to;
          }
        } else if (
          node.name === "EmphasisMark" ||
          node.name === "EmphasisSymbol" ||
          node.name === "StrikethroughMark" ||
          node.name === "HighlightMark" ||
          node.name === "LinkMark"
        ) {
          const parent = node.node.parent;
          if (parent) {
            parentFrom = parent.from;
            parentTo = parent.to;
          }
        } else if (node.name === "QuoteMark") {
          const line = state.doc.lineAt(node.from);
          parentFrom = line.from;
          parentTo = line.to;
        } else if (node.name === "CodeMark") {
          const parent = node.node.parent;
          if (parent) {
            parentFrom = parent.from;
            parentTo = parent.to;
          }
        }

        const isMark =
          node.name === "EmphasisMark" ||
          node.name === "EmphasisSymbol" ||
          node.name === "StrikethroughMark" ||
          node.name === "HighlightMark" ||
          node.name === "HeaderMark" ||
          node.name === "LinkMark" ||
          node.name === "QuoteMark" ||
          node.name === "CodeMark" ||
          node.name === "CodeInfo";

        if (isMark) {
          const active =
            isEditable &&
            isRangeSelected(state.selection, parentFrom, parentTo);
          const deco = active ? markerActiveDeco : markerHiddenDeco;
          builder.push(deco.range(node.from, node.to));
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
          const active =
            isEditable && isRangeSelected(state.selection, node.from, node.to);
          const deco = active ? markerActiveDeco : markerHiddenDeco;
          builder.push(deco.range(node.from, node.from + 1));
        } else if (node.name === "HorizontalRule") {
          const line = state.doc.lineAt(node.from);
          const active =
            isEditable && isRangeSelected(state.selection, line.from, line.to);
          const deco = active ? markerActiveDeco : markerHiddenDeco;
          builder.push(hrLineDeco.range(line.from));
          builder.push(deco.range(node.from, node.to));
        }
      },
    });

    // Check wikilinks within visible text slice
    const chunkText = state.doc.sliceString(from, to);
    for (const match of chunkText.matchAll(WIKILINK_REGEX)) {
      const start = from + match.index!;
      const end = start + match[0].length;
      const active = isEditable && isRangeSelected(state.selection, start, end);
      const deco = active ? markerActiveDeco : markerHiddenDeco;

      builder.push(deco.range(start, start + 2));
      builder.push(deco.range(end - 2, end));

      const inner = match[1] ?? "";
      const pipeIndex = inner.indexOf("|");
      if (pipeIndex !== -1) {
        builder.push(deco.range(start + 2, start + 2 + pipeIndex + 1));
      }
    }
  }

  builder.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(builder, true);
}

const livePreviewTheme = EditorView.baseTheme({
  ".cm-editor .cm-activeLine .cm-marker-hidden": {
    display: "none !important",
  },
  ".cm-marker-active": {
    display: "inline !important",
    opacity: "0.5",
    color: "var(--color-text-muted)",
    fontSize: "inherit",
    lineHeight: "inherit",
  },
  ".cm-marker-hidden": {
    display: "none !important",
  },
});

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getLivePreviewDecos(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = getLivePreviewDecos(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export const livePreviewExtension: Extension = [
  livePreviewPlugin,
  livePreviewTheme,
];
