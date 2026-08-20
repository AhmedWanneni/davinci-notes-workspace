import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { TagRegistry, matchTags } from "@app/core-types";

export interface TagExtensionOptions {
  onTagClick?: (tagKey: string) => void;
}

const codeNodes = new Set(["CodeBlock", "FencedCode", "InlineCode", "CodeSpan"]);

function isCodePosition(state: EditorView["state"], position: number) {
  let node: SyntaxNode | null = syntaxTree(state).resolveInner(position);
  while (node) {
    if (codeNodes.has(node.name)) return true;
    node = node.parent;
  }
  return false;
}

class TagWidget extends WidgetType {
  constructor(
    readonly label: string,
    readonly key: string,
    readonly onTagClick: (tagKey: string) => void,
  ) {
    super();
  }

  eq(other: TagWidget) {
    return this.label === other.label && this.key === other.key;
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-tag";
    element.textContent = this.label;
    element.dataset.tag = this.key;
    element.title = `Filter by ${this.label}`;
    element.setAttribute("role", "button");
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onTagClick(this.key);
    });
    return element;
  }

  ignoreEvent() {
    return false;
  }
}

function getTagDecorations(
  view: EditorView,
  onTagClick: (tagKey: string) => void,
  registry: TagRegistry,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    const lineStart = view.state.doc.lineAt(from).from;
    const lineEnd = view.state.doc.lineAt(to).to;
    const text = view.state.doc.sliceString(lineStart, lineEnd);
    for (const match of matchTags(text)) {
      const start = lineStart + match.start;
      const end = lineStart + match.end;
      if (isCodePosition(view.state, start + 1)) continue;
      const tag = registry.register(match.raw);
      decorations.push(
        Decoration.replace({
          widget: new TagWidget(tag.display, tag.key, onTagClick),
        }).range(start, end),
      );
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

export function tagExtension(options: TagExtensionOptions = {}) {
  const onTagClick = options.onTagClick ?? (() => {});
  const registry = new TagRegistry();

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getTagDecorations(view, onTagClick, registry);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = getTagDecorations(update.view, onTagClick, registry);
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );
}
