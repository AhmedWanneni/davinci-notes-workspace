import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateEffect } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";

export interface MermaidExtensionOptions {
  isReadOnly?: boolean;
  onLinkClick: (targetRaw: string) => void;
}

interface MermaidBlock {
  from: number;
  to: number;
  source: string;
  lineFrom: number;
  lineTo: number;
}

function mermaidSource(state: EditorState, from: number, to: number) {
  const lines = state.sliceDoc(from, to).split("\n");
  const last = lines.at(-1)?.trim() ?? "";
  const end = /^(?:`{3,}|~{3,})\s*$/.test(last) ? -1 : undefined;
  return lines.slice(1, end).join("\n");
}

const refreshMermaid = StateEffect.define<void>();
let mermaidLoader: Promise<typeof import("mermaid").default> | null = null;
let mermaidInitialized = false;
let renderId = 0;

function loadMermaid() {
  mermaidLoader ??= import("mermaid").then((module) => module.default);
  return mermaidLoader;
}

function findMermaidBlocks(state: EditorState): MermaidBlock[] {
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

function activeMermaidBlock(view: EditorView, blocks: MermaidBlock[]) {
  const line = view.state.doc.lineAt(view.state.selection.main.head).number;
  return blocks.find((block) => line >= block.lineFrom && line <= block.lineTo);
}

function internalLinkTargets(source: string): Map<string, string> {
  const targets = new Map<string, string>();
  for (const match of source.matchAll(
    /^\s*class\s+([\w-]+)\s+internal-link\s*;/gmu,
  )) {
    targets.set(match[1], match[1]);
  }
  return targets;
}

function bindInternalLinks(
  container: HTMLElement,
  source: string,
  onLinkClick: (targetRaw: string) => void,
) {
  const targets = internalLinkTargets(source);
  for (const [nodeId, target] of targets) {
    const nodes = [...container.querySelectorAll<SVGGElement>("[id]")].filter(
      (node) => node.id.includes(`-${nodeId}-`),
    );
    nodes.forEach((node) => {
      node.classList.add("cm-mermaid-internal-link");
      node.addEventListener("click", () => onLinkClick(target));
    });
  }
}

class MermaidWidget extends WidgetType {
  constructor(
    readonly source: string,
    readonly onLinkClick: (targetRaw: string) => void,
  ) {
    super();
  }

  eq(other: MermaidWidget) {
    return this.source === other.source;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-mermaid-diagram";
    container.textContent = "Rendering diagram…";
    const id = `cm-mermaid-${renderId++}`;

    void loadMermaid()
      .then(async (mermaid) => {
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
          mermaidInitialized = true;
        }
        const result = await mermaid.render(id, this.source);
        if (!container.isConnected) return;
        container.innerHTML = result.svg;
        bindInternalLinks(container, this.source, this.onLinkClick);
      })
      .catch((error: unknown) => {
        if (!container.isConnected) return;
        container.className = "cm-mermaid-diagram cm-mermaid-error";
        container.textContent = `Mermaid diagram error: ${
          error instanceof Error ? error.message : "invalid syntax"
        }`;
      });
    return container;
  }

  ignoreEvent() {
    return false;
  }
}

class MermaidContinuationWidget extends WidgetType {
  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-mermaid-continuation";
    return element;
  }

  eq() {
    return true;
  }
}

function getMermaidDecorations(
  view: EditorView,
  options: MermaidExtensionOptions,
): DecorationSet {
  const blocks = findMermaidBlocks(view.state);
  const active = options.isReadOnly ? null : activeMermaidBlock(view, blocks);
  const decorations: Range<Decoration>[] = [];
  for (const block of blocks) {
    if (block === active) continue;
    for (
      let lineNumber = block.lineFrom;
      lineNumber <= block.lineTo;
      lineNumber++
    ) {
      const line = view.state.doc.line(lineNumber);
      if (line.from === line.to) continue;
      decorations.push(
        Decoration.replace({
          widget:
            lineNumber === block.lineFrom
              ? new MermaidWidget(block.source, options.onLinkClick)
              : new MermaidContinuationWidget(),
        }).range(line.from, line.to),
      );
    }
  }
  return Decoration.set(decorations);
}

export function mermaidExtension(options: MermaidExtensionOptions) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      timer: ReturnType<typeof setTimeout> | undefined;

      constructor(readonly view: EditorView) {
        this.decorations = getMermaidDecorations(view, options);
      }

      update(update: ViewUpdate) {
        if (
          update.transactions.some((transaction) =>
            transaction.effects.some((effect) => effect.is(refreshMermaid)),
          )
        ) {
          this.decorations = getMermaidDecorations(update.view, options);
          return;
        }
        if (update.selectionSet) {
          this.decorations = getMermaidDecorations(update.view, options);
          return;
        }
        if (update.docChanged) {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.view.dispatch({ effects: refreshMermaid.of() });
          }, 150);
        }
      }

      destroy() {
        clearTimeout(this.timer);
      }
    },
    { decorations: (value) => value.decorations },
  );
}
