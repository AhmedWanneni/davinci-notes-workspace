import { syntaxTree } from "@codemirror/language";
import { Range, EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { ReminderWidget, type ReminderClickInfo } from "./reminderWidget";

export interface ReminderExtensionOptions {
  onReminderClick?: (info: ReminderClickInfo) => void;
}

const REMINDER_TOKEN_REGEX = /\(@([^)]+)\)/g;

const TASK_DONE_REGEX = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[[xX]\]/;

const CODE_NODES = new Set([
  "CodeBlock",
  "FencedCode",
  "InlineCode",
  "CodeSpan",
  "CodeText",
  "CodeInfo",
  "Frontmatter",
  "YamlFrontmatter",
]);

const FRONTMATTER_REGEX = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

function getFrontmatterEnd(doc: string): number {
  if (!doc.startsWith("---")) return 0;
  const match = FRONTMATTER_REGEX.exec(doc);
  return match ? match[0].length : 0;
}

function isCodePosition(state: EditorState, position: number): boolean {
  let node: SyntaxNode | null = syntaxTree(state).resolveInner(position);
  while (node) {
    if (CODE_NODES.has(node.name)) return true;
    node = node.parent;
  }
  return false;
}

function isRangeSelected(
  selection: EditorState["selection"],
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

function getReminderDecorations(
  view: EditorView,
  onReminderClick?: (info: ReminderClickInfo) => void,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;
  const docText = state.doc.toString();
  const frontmatterEnd = getFrontmatterEnd(docText);

  for (const { from, to } of view.visibleRanges) {
    const lineStart = state.doc.lineAt(from).from;
    const lineEnd = state.doc.lineAt(to).to;
    let currPos = lineStart;

    while (currPos <= lineEnd) {
      const line = state.doc.lineAt(currPos);
      const text = line.text;

      if (text.includes("(@")) {
        const isDone = TASK_DONE_REGEX.test(text);
        REMINDER_TOKEN_REGEX.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = REMINDER_TOKEN_REGEX.exec(text)) !== null) {
          const rawTokenInside = match[1].trim();
          const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawTokenInside);
          if (!dateMatch) {
            continue;
          }

          const date = dateMatch[1];
          let rest = rawTokenInside.slice(date.length).trim();
          let recurrence: string | undefined;
          const slashIdx = rest.indexOf("/");
          if (slashIdx !== -1) {
            recurrence = rest.slice(slashIdx + 1).trim();
            rest = rest.slice(0, slashIdx).trim();
          }
          let time: string | undefined;
          const timeMatch = /^(\d{1,2}:\d{2}(?::\d{2})?)/.exec(rest);
          if (timeMatch) {
            time = timeMatch[1];
          }

          const start = line.from + match.index;
          const end = start + match[0].length;

          // Skip frontmatter
          if (start < frontmatterEnd) {
            continue;
          }

          // Skip code blocks and inline code
          if (isCodePosition(state, start + 1)) {
            continue;
          }

          // Cursor gating: reveal raw token when cursor is on or adjacent to it
          if (isRangeSelected(state.selection, start, end)) {
            continue;
          }

          decorations.push(
            Decoration.replace({
              widget: new ReminderWidget({
                date,
                time,
                recurrence,
                rawToken: match[0],
                from: start,
                to: end,
                isDone,
                onReminderClick,
              }),
            }).range(start, end),
          );
        }
      }

      currPos = line.to + 1;
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

export function reminderExtension(options: ReminderExtensionOptions = {}) {
  const onReminderClick = options.onReminderClick;

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getReminderDecorations(view, onReminderClick);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = getReminderDecorations(
            update.view,
            onReminderClick,
          );
        }
      }
    },
    {
      decorations: (instance) => instance.decorations,
    },
  );
}
