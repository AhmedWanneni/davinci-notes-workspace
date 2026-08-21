import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { EditorState, StateField } from "@codemirror/state";
import { sanitizeHtml } from "@app/sanitize";

export interface HtmlBlock {
  from: number;
  to: number;
  source: string;
}

const TAG_PATTERN = /<!--[^]*?-->|<\/?([a-z][\w-]*)\b[^>]*?>/giu;

export function findHtmlBlocks(state: EditorState): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  const lines = state.doc.toString().split("\n");
  const starts: number[] = [];
  let offset = 0;
  lines.forEach((line) => { starts.push(offset); offset += line.length + 1; });
  for (let index = 0; index < lines.length; index += 1) {
    const openingName = /^<([a-z][\w-]*)\b/iu.exec(lines[index]!.trim())?.[1]?.toLowerCase();
    if (!openingName || !["table", "div"].includes(openingName)) continue;
    const stack: string[] = [];
    let endLine = -1;
    for (let cursor = index; cursor < lines.length; cursor += 1) {
      if (!lines[cursor]!.trim()) break;
      for (const match of lines[cursor]!.matchAll(TAG_PATTERN)) {
        const raw = match[0];
        const name = match[1]?.toLowerCase();
        if (!name || raw.startsWith("<!--") || /\/\s*>$/u.test(raw)) continue;
        if (raw.startsWith("</")) {
          if (stack.at(-1) !== name) { stack.length = 0; break; }
          stack.pop();
          if (stack.length === 0) { endLine = cursor; break; }
        } else stack.push(name);
      }
      if (endLine >= 0 || stack.length === 0) break;
    }
    if (endLine < 0) continue;
    const from = starts[index]!;
    const to = starts[endLine]! + lines[endLine]!.length;
    blocks.push({ from, to, source: state.doc.sliceString(from, to) });
    index = endLine;
  }
  return blocks;
}

class HtmlBlockWidget extends WidgetType {
  constructor(readonly sanitizedHtml: string) { super(); }
  eq(other: HtmlBlockWidget) { return this.sanitizedHtml === other.sanitizedHtml; }
  toDOM() {
    const element = document.createElement("div");
    element.className = "cm-html-block";
    element.innerHTML = this.sanitizedHtml;
    return element;
  }
  ignoreEvent() { return true; }
}

export function htmlBlockExtension() {
  const decorations = StateField.define<DecorationSet>({
    create: (state) => buildHtmlBlockDecorations(state),
    update: (value, transaction) => transaction.docChanged || transaction.selection
      ? buildHtmlBlockDecorations(transaction.state)
      : value,
    provide: (field) => EditorView.decorations.from(field),
  });
  return decorations;
}

function buildHtmlBlockDecorations(state: EditorState): DecorationSet {
  const cursor = state.selection.main.head;
  const editable = state.facet(EditorView.editable);
  const ranges = findHtmlBlocks(state)
    .filter((block) => !editable || cursor <= block.from || cursor >= block.to)
    .map((block) => Decoration.replace({
      widget: new HtmlBlockWidget(sanitizeHtml(block.source.trim())),
      block: true,
      inclusive: true,
    }).range(block.from, block.to));
  return Decoration.set(ranges, true);
}
