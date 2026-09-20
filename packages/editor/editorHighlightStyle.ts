import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import { highlightTag } from "./highlightExtension";

export const editorHighlightStyle = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: "var(--editor-heading-h1-size)",
    fontWeight: "var(--editor-heading-h1-weight)",
    lineHeight: "var(--editor-heading-h1-line-height)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading2,
    fontSize: "var(--editor-heading-h2-size)",
    fontWeight: "var(--editor-heading-h2-weight)",
    lineHeight: "var(--editor-heading-h2-line-height)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading3,
    fontSize: "var(--editor-heading-h3-size)",
    fontWeight: "var(--editor-heading-h3-weight)",
    lineHeight: "var(--editor-heading-h3-line-height)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading4,
    fontSize: "var(--editor-heading-h4-size)",
    fontWeight: "var(--editor-heading-h4-weight)",
    lineHeight: "var(--editor-heading-h4-line-height)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading5,
    fontSize: "var(--editor-heading-h5-size)",
    fontWeight: "var(--editor-heading-h5-weight)",
    lineHeight: "var(--editor-heading-h5-line-height)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading6,
    fontSize: "var(--editor-heading-h6-size)",
    fontWeight: "var(--editor-heading-h6-weight)",
    lineHeight: "var(--editor-heading-h6-line-height)",
    color: "var(--color-text-muted)",
  },
  { tag: t.strong, fontWeight: "var(--type-weight-bold)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  {
    tag: highlightTag,
    backgroundColor: "var(--color-bg-highlight, rgba(241, 196, 15, 0.3))",
    borderRadius: "var(--editor-code-radius)",
    padding: "0 var(--editor-code-padding-x)",
  },
  {
    tag: t.monospace,
    fontFamily: "var(--font-editor)",
    color: "var(--color-text-accent)",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--editor-code-radius)",
    padding: "0 var(--editor-code-padding-x)",
  },
  { tag: t.keyword, color: "var(--color-text-accent)" },
  {
    tag: t.link,
    color: "var(--color-text-accent)",
    textDecoration: "underline",
  },
]);
