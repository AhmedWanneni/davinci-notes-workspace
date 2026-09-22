import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import { highlightTag } from "./highlightExtension";

export const editorHighlightStyle = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: "var(--type-scale-2xl)",
    fontWeight: "var(--type-weight-bold)",
    lineHeight: "var(--type-leading-tight)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading2,
    fontSize: "var(--type-scale-xl)",
    fontWeight: "var(--type-weight-semibold)",
    lineHeight: "var(--type-leading-tight)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading3,
    fontSize: "var(--type-scale-lg)",
    fontWeight: "var(--type-weight-semibold)",
    lineHeight: "var(--type-leading-normal)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading4,
    fontSize: "var(--type-scale-base)",
    fontWeight: "var(--type-weight-semibold)",
    lineHeight: "var(--type-leading-normal)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading5,
    fontSize: "var(--type-scale-base)",
    fontWeight: "var(--type-weight-medium)",
    lineHeight: "var(--type-leading-normal)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading6,
    fontSize: "var(--type-scale-base)",
    fontWeight: "var(--type-weight-medium)",
    lineHeight: "var(--type-leading-normal)",
    color: "var(--color-text-muted)",
  },
  { tag: t.strong, fontWeight: "var(--type-weight-bold)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  {
    tag: highlightTag,
    backgroundColor: "var(--color-bg-active)",
    borderRadius: "var(--border-radius-sm)",
    padding: "0 var(--space-1)",
  },
  {
    tag: t.monospace,
    fontFamily: "var(--font-editor)",
    color: "var(--color-text-accent)",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm)",
    padding: "0 var(--space-1)",
  },
  { tag: t.keyword, color: "var(--color-text-accent)" },
  {
    tag: t.link,
    color: "var(--color-text-accent)",
    textDecoration: "underline",
  },
]);
