import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import { highlightTag } from "./highlightExtension";

export const editorHighlightStyle = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: "var(--type-scale-2xl)",
    fontWeight: "var(--type-weight-bold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading2,
    fontSize: "var(--type-scale-xl)",
    fontWeight: "var(--type-weight-bold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading3,
    fontSize: "var(--type-scale-lg)",
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading4,
    fontSize: "var(--type-scale-base)",
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-normal)",
  },
  { tag: t.strong, fontWeight: "var(--type-weight-bold)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  {
    tag: highlightTag,
    backgroundColor: "var(--color-bg-highlight, rgba(241, 196, 15, 0.3))",
    borderRadius: "var(--border-radius-sm, 2px)",
    padding: "0 2px",
  },
  {
    tag: t.monospace,
    fontFamily: "var(--font-editor)",
    color: "var(--color-text-accent)",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm)",
    padding: "0 3px",
  },
  { tag: t.keyword, color: "var(--color-text-accent)" },
  {
    tag: t.link,
    color: "var(--color-text-accent)",
    textDecoration: "underline",
  },
]);
