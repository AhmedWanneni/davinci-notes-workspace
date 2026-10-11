import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { mathBlocksField } from "../blocks/math";

const CODE_OR_LINK_NODES = new Set([
  "CodeBlock",
  "FencedCode",
  "InlineCode",
  "CodeSpan",
  "CodeText",
  "CodeInfo",
  "CodeMark",
  "URL",
  "Link",
  "Frontmatter",
  "YAMLFrontmatter",
]);

export interface SlashMenuTriggerContext {
  state?: EditorState;
  pos?: number;
  view?: EditorView | null;
}

export function isInsideFrontmatter(state: EditorState, pos: number): boolean {
  if (state.doc.lines === 0) return false;
  const firstLine = state.doc.line(1).text.trim();
  if (firstLine !== "---") return false;
  const maxScan = Math.min(state.doc.lines, 200);
  for (let lineNumber = 2; lineNumber <= maxScan; lineNumber++) {
    const line = state.doc.line(lineNumber);
    const text = line.text.trim();
    if (text === "---" || text === "...") {
      return pos <= line.to;
    }
  }
  return false;
}

export function isInsideMath(state: EditorState, pos: number): boolean {
  const line = state.doc.lineAt(pos);
  const blocks = state.field(mathBlocksField, false);
  if (blocks) {
    if (
      blocks.some((b) => line.number >= b.fromLine && line.number <= b.toLine)
    ) {
      return true;
    }
  } else {
    let openLine: number | null = null;
    for (let l = 1; l <= state.doc.lines; l++) {
      const text = state.doc.line(l).text.trim();
      if (openLine === null && text === "$$") {
        openLine = l;
      } else if (openLine !== null && text === "$$") {
        if (line.number >= openLine && line.number <= l) return true;
        openLine = null;
      }
    }
  }

  const lineOffset = pos - line.from;
  for (const match of line.text.matchAll(
    /(?<!\\)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
  )) {
    const start = match.index!;
    const end = start + match[0].length;
    if (lineOffset >= start && lineOffset <= end) {
      return true;
    }
  }

  return false;
}

export function isInsideSyntaxExclusion(
  state: EditorState,
  pos: number,
): boolean {
  const tree = syntaxTree(state);
  for (const side of [-1, 1] as const) {
    let node: import("@lezer/common").SyntaxNode | null = tree.resolveInner(
      pos,
      side,
    );
    while (node) {
      if (CODE_OR_LINK_NODES.has(node.name)) return true;
      node = node.parent;
    }
  }
  return false;
}

export function isSlashMenuTrigger(
  before: string,
  enabled: boolean,
  vimMode?: string | null,
  context?: SlashMenuTriggerContext,
): boolean {
  if (!enabled || (vimMode && vimMode !== "INSERT" && vimMode !== "REPLACE"))
    return false;
  if (context?.view?.composing) return false;
  if (before.length > 0 && !/\s$/.test(before)) return false;

  if (context?.state && context.pos !== undefined) {
    if (isInsideSyntaxExclusion(context.state, context.pos)) return false;
    if (isInsideFrontmatter(context.state, context.pos)) return false;
    if (isInsideMath(context.state, context.pos)) return false;
  }

  return true;
}
