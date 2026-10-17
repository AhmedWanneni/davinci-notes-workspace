import { Decoration, DecorationSet, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import { Range } from "@codemirror/state";
import { sanitizeHtml } from "@app/sanitize";

interface InlineHtmlRange { from: number; to: number; source: string; comment: boolean; }
const INLINE_PATTERN = /<!--[\s\S]*?-->|<(u|s|span|div)\b[^>]*>[\s\S]*?<\/(?:u|s|span|div)\s*>/gi;

export function findInlineHtml(view: EditorView): InlineHtmlRange[] {
  const ranges: InlineHtmlRange[] = [];
  for (const visible of view.visibleRanges) {
    const line = view.state.doc.lineAt(visible.from);
    const last = view.state.doc.lineAt(Math.min(visible.to, view.state.doc.length));
    for (let number = line.number; number <= last.number; number += 1) {
      const current = view.state.doc.line(number);
      for (const match of current.text.matchAll(INLINE_PATTERN)) {
        const source = match[0];
        const from = current.from + match.index!;
        if (source.startsWith("<!--")) {
          ranges.push({ from, to: from + source.length, source, comment: true });
          continue;
        }
        const tagName = match[1]?.toLowerCase();
        if (tagName === "div" && current.text.trimStart().startsWith("<div")) continue;
        ranges.push({ from, to: from + source.length, source, comment: false });
      }
    }
  }
  return ranges;
}

class InlineHtmlWidget extends WidgetType {
  constructor(readonly html: string, readonly hidden: boolean) { super(); }
  eq(other: InlineHtmlWidget) { return this.html === other.html && this.hidden === other.hidden; }
  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-inline-html";
    if (!this.hidden) element.innerHTML = this.html;
    return element;
  }
  ignoreEvent() { return true; }
}

export function htmlInlineExtension() {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(update: { view: EditorView; docChanged: boolean; viewportChanged: boolean }) {
      if (update.docChanged || update.viewportChanged) this.decorations = this.build(update.view);
    }
    build(view: EditorView) {
      const ranges: Range<Decoration>[] = [];
      for (const range of findInlineHtml(view)) {
        const sanitized = sanitizeHtml(range.source);
        ranges.push(Decoration.replace({ widget: new InlineHtmlWidget(sanitized, range.comment) }).range(range.from, range.to));
      }
      return Decoration.set(ranges, true);
    }
  }, { decorations: (value) => value.decorations });
}
