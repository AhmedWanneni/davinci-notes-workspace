import { Tag, tags as t } from "@lezer/highlight";
import type { MarkdownExtension } from "@lezer/markdown";

export const highlightTag = Tag.define();

const highlightDelim = { resolve: "Highlight", mark: "HighlightMark" };

/**
 * Lezer Markdown extension for Obsidian-style `==highlight==` syntax.
 */
export const highlightExtension: MarkdownExtension = {
  defineNodes: [
    {
      name: "Highlight",
      style: { "Highlight/...": highlightTag },
    },
    {
      name: "HighlightMark",
      style: t.processingInstruction,
    },
  ],
  parseInline: [
    {
      name: "Highlight",
      parse(cx, next, pos) {
        // Must be `==` and not `===`
        if (next !== 61 || cx.char(pos + 1) !== 61 || cx.char(pos + 2) === 61) {
          return -1;
        }

        const before = cx.slice(pos - 1, pos);
        const after = cx.slice(pos + 2, pos + 3);
        const sBefore = /\s|^$/.test(before);
        const sAfter = /\s|^$/.test(after);
        const pBefore = /\p{P}|\p{S}/u.test(before);
        const pAfter = /\p{P}|\p{S}/u.test(after);

        const open = !sAfter && (!pAfter || sBefore || pBefore);
        const close = !sBefore && (!pBefore || sAfter || pAfter);

        return cx.addDelimiter(highlightDelim, pos, pos + 2, open, close);
      },
      after: "Emphasis",
    },
  ],
};
