import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

export interface MarkdownAnnotationsOptions {
  isReadOnly?: boolean;
}

class FootnoteWidget extends WidgetType {
  constructor(readonly number: number) {
    super();
  }

  toDOM() {
    const element = document.createElement("sup");
    element.className = "cm-footnote-reference";
    element.textContent = String(this.number);
    element.setAttribute("aria-label", `Footnote ${this.number}`);
    return element;
  }

  eq(other: FootnoteWidget) {
    return this.number === other.number;
  }
}

class FootnoteDefinitionWidget extends WidgetType {
  constructor(readonly number: number) {
    super();
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-footnote-definition-marker";
    element.textContent = `${this.number}.`;
    return element;
  }

  eq(other: FootnoteDefinitionWidget) {
    return this.number === other.number;
  }
}

const blockquoteLineDeco = Decoration.line({ class: "cm-blockquote-line" });
const headingLineDecos = Array.from({ length: 6 }, (_, index) =>
  Decoration.line({ class: `cm-heading-line cm-heading-${index + 1}` }),
);
const codeBlockLineDeco = Decoration.line({ class: "cm-code-block-line" });
const commentDeco = Decoration.mark({ class: "cm-markdown-comment" });
const hiddenCommentDeco = Decoration.replace({});

function footnoteDeco(widget: WidgetType) {
  return Decoration.replace({ widget });
}

const footnoteReference = /\[\^([^\]]+)\]/g;
const footnoteDefinition = /^[ \t]{0,3}\[\^([^\]]+)\]:/;
const inlineFootnote = /\^\[([^\]]*)\]/g;
const comment = /%%[\s\S]*?%%/g;

function isCodePosition(state: EditorView["state"], position: number) {
  let node: SyntaxNode | null = syntaxTree(state).resolve(position);
  while (node) {
    if (
      node.name === "CodeBlock" ||
      node.name === "FencedCode" ||
      node.name === "InlineCode"
    ) {
      return true;
    }
    node = node.parent;
  }
  return false;
}

function isOverlapping(
  ranges: readonly Range<Decoration>[],
  from: number,
  to: number,
) {
  return ranges.some((range) => range.from < to && from < range.to);
}

function collectFootnoteNumbers(view: EditorView) {
  const numbers = new Map<string, number>();
  let nextNumber = 1;
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    for (const match of text.matchAll(footnoteReference)) {
      const key = match[1];
      if (!numbers.has(key)) numbers.set(key, nextNumber++);
    }
  }
  return numbers;
}

function getAnnotations(
  view: EditorView,
  options: MarkdownAnnotationsOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const numbers = collectFootnoteNumbers(view);
  const state = view.state;
  const add = (from: number, to: number, decoration: Decoration) => {
    if (!isOverlapping(ranges, from, to))
      ranges.push(decoration.range(from, to));
  };

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
        if (node.name !== "Blockquote") return;
        for (let line = state.doc.lineAt(node.from); line.from < node.to;) {
          ranges.push(blockquoteLineDeco.range(line.from));
          if (line.to >= node.to || line.number === state.doc.lines) break;
          line = state.doc.line(line.number + 1);
        }
      },
    });

    const text = state.sliceDoc(from, to);
    for (const match of text.matchAll(comment)) {
      const commentFrom = from + match.index!;
      const commentTo = commentFrom + match[0].length;
      if (isCodePosition(state, commentFrom)) continue;
      add(
        commentFrom,
        commentTo,
        options.isReadOnly ? hiddenCommentDeco : commentDeco,
      );
    }

    for (let line = state.doc.lineAt(from); line.from < to;) {
      const heading = line.text.match(/^ {0,3}(#{1,6})\s/);
      if (heading) {
        const level = heading[1].length;
        ranges.push(headingLineDecos[level - 1].range(line.from));
      }
      if (isCodePosition(state, line.from)) {
        ranges.push(codeBlockLineDeco.range(line.from));
      }
      const definition = line.text.match(footnoteDefinition);
      if (definition && !isCodePosition(state, line.from)) {
        const key = definition[1];
        const number = numbers.get(key) ?? numbers.size + 1;
        if (!numbers.has(key)) numbers.set(key, number);
        const markerFrom = line.from + (definition[0].length - key.length - 4);
        add(
          markerFrom,
          line.from + definition[0].length,
          footnoteDeco(new FootnoteDefinitionWidget(number)),
        );
      }
      if (line.number === state.doc.lines) break;
      line = state.doc.line(line.number + 1);
    }

    for (const match of text.matchAll(footnoteReference)) {
      const referenceFrom = from + match.index!;
      if (isCodePosition(state, referenceFrom)) continue;
      const line = state.doc.lineAt(referenceFrom);
      if (line.text.match(footnoteDefinition)) continue;
      const number = numbers.get(match[1]) ?? numbers.size + 1;
      numbers.set(match[1], number);
      add(
        referenceFrom,
        referenceFrom + match[0].length,
        footnoteDeco(new FootnoteWidget(number)),
      );
    }

    if (options.isReadOnly) {
      let inlineNumber = numbers.size + 1;
      for (const match of text.matchAll(inlineFootnote)) {
        const inlineFrom = from + match.index!;
        if (isCodePosition(state, inlineFrom)) continue;
        add(
          inlineFrom,
          inlineFrom + match[0].length,
          footnoteDeco(new FootnoteWidget(inlineNumber++)),
        );
      }
    }
  }

  ranges.sort((a, b) => a.from - b.from);
  return Decoration.set(ranges, true);
}

export function markdownAnnotationsExtension(
  options: MarkdownAnnotationsOptions = {},
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getAnnotations(view, options);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = getAnnotations(update.view, options);
        }
      }
    },
    { decorations: (value) => value.decorations },
  );
}
