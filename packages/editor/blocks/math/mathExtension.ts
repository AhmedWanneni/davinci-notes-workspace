import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { EditorState, Range, StateEffect } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import "katex/dist/katex.min.css";

export interface MathExtensionOptions {
  isReadOnly?: boolean;
}

interface MathBlock {
  fromLine: number;
  toLine: number;
  source: string;
}

const refreshMath = StateEffect.define<void>();
let katexLoader: Promise<typeof import("katex").default> | null = null;

function loadKatex() {
  katexLoader ??= import("katex").then((module) => module.default);
  return katexLoader;
}

function findBlocks(state: EditorState): MathBlock[] {
  const blocks: MathBlock[] = [];
  let opening: number | null = null;
  const lines = Array.from(state.doc.iterLines());
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const text = lines[lineNumber - 1].trim();
    if (opening === null && text === "$$") opening = lineNumber;
    else if (opening !== null && text === "$$") {
      blocks.push({
        fromLine: opening,
        toLine: lineNumber,
        source: lines.slice(opening, lineNumber - 1).join("\n"),
      });
      opening = null;
    }
  }
  return blocks;
}

function inCode(state: EditorState, position: number) {
  let node: SyntaxNode | null = syntaxTree(state).resolveInner(position);
  while (node) {
    if (["FencedCode", "InlineCode", "CodeSpan"].includes(node.name)) {
      return true;
    }
    node = node.parent;
  }
  return false;
}

class MathWidget extends WidgetType {
  constructor(
    readonly expression: string,
    readonly displayMode: boolean,
  ) {
    super();
  }

  eq(other: MathWidget) {
    return (
      this.expression === other.expression &&
      this.displayMode === other.displayMode
    );
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = this.displayMode ? "cm-math-block" : "cm-math-inline";
    void loadKatex()
      .then((katex) => {
        if (!element.isConnected) return;
        katex.render(this.expression, element, {
          displayMode: this.displayMode,
          throwOnError: true,
          strict: "warn",
        });
      })
      .catch((error: unknown) => {
        if (!element.isConnected) return;
        element.className += " cm-math-error";
        element.textContent = `Math error: ${
          error instanceof Error ? error.message : "invalid LaTeX"
        }`;
      });
    return element;
  }

  ignoreEvent() {
    return false;
  }
}

class MathContinuationWidget extends WidgetType {
  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-math-continuation";
    return element;
  }

  eq() {
    return true;
  }
}

function activeBlock(view: EditorView, blocks: MathBlock[]) {
  const line = view.state.doc.lineAt(view.state.selection.main.head).number;
  return blocks.find((block) => line >= block.fromLine && line <= block.toLine);
}

function decorationsFor(view: EditorView, options: MathExtensionOptions) {
  const blocks = findBlocks(view.state);
  const active = options.isReadOnly ? null : activeBlock(view, blocks);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    if (block === active) continue;
    for (let line = block.fromLine; line <= block.toLine; line++) {
      const docLine = view.state.doc.line(line);
      if (docLine.from === docLine.to) continue;
      decorations.push(
        Decoration.replace({
          widget:
            line === block.fromLine
              ? new MathWidget(block.source, true)
              : new MathContinuationWidget(),
        }).range(docLine.from, docLine.to),
      );
    }
  }

  const activeLine = options.isReadOnly
    ? -1
    : view.state.doc.lineAt(view.state.selection.main.head).number;
  for (const { from, to } of view.visibleRanges) {
    const first = view.state.doc.lineAt(from).number;
    const last = view.state.doc.lineAt(to).number;
    for (let line = first; line <= last; line++) {
      if (line === activeLine) continue;
      const docLine = view.state.doc.line(line);
      if (
        blocks.some((block) => line >= block.fromLine && line <= block.toLine)
      ) {
        continue;
      }
      for (const match of docLine.text.matchAll(
        /(?<!\\)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
      )) {
        const from = docLine.from + match.index!;
        const to = from + match[0].length;
        if (!inCode(view.state, from + 1)) {
          decorations.push(
            Decoration.replace({
              widget: new MathWidget(match[1], false),
            }).range(from, to),
          );
        }
      }
    }
  }
  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

export function mathExtension(options: MathExtensionOptions = {}) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      timer: ReturnType<typeof setTimeout> | undefined;

      constructor(readonly view: EditorView) {
        this.decorations = decorationsFor(view, options);
      }

      update(update: ViewUpdate) {
        if (update.selectionSet) {
          this.decorations = decorationsFor(update.view, options);
          return;
        }
        if (update.docChanged) {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.view.dispatch({ effects: refreshMath.of() });
          }, 150);
        }
        if (
          update.transactions.some((transaction) =>
            transaction.effects.some((effect) => effect.is(refreshMath)),
          )
        ) {
          this.decorations = decorationsFor(update.view, options);
        }
      }

      destroy() {
        clearTimeout(this.timer);
      }
    },
    { decorations: (value) => value.decorations },
  );
}
