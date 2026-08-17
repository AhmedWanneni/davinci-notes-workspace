import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

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
  { tag: t.monospace, fontFamily: "var(--font-editor)" },
  { tag: t.keyword, color: "var(--color-text-accent)" },
  {
    tag: t.link,
    color: "var(--color-text-accent)",
    textDecoration: "underline",
  },
]);

export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor)",
    fontSize: "var(--type-scale-base)",
    lineHeight: "var(--type-leading-relaxed)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
  },
  ".cm-content": {
    padding: "var(--space-6) var(--space-8)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-text-accent)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--color-bg-active) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--color-bg-primary-alt)",
  },
  ".cm-wikilink": {
    color: "var(--color-text-accent)",
    textDecoration: "none",
    cursor: "pointer",
  },
  ".cm-wikilink:hover": {
    textDecoration: "underline",
  },
  ".cm-wikilink-unresolved": {
    textDecoration: "none",
    borderBottom: "1px dashed var(--color-text-accent)",
  },
  ".cm-markdown-syntax": {
    display: "none !important",
  },
  ".cm-activeLine .cm-markdown-syntax": {
    display: "inline !important",
    opacity: 0.5,
  },
});

export const readOnlyEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor)",
    fontSize: "var(--type-scale-sm, 13px)",
    lineHeight: "1.5",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "var(--space-2) var(--space-3)",
  },
  ".cm-cursor": {
    display: "none",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--color-bg-active) !important",
  },
  ".cm-wikilink": {
    color: "var(--color-text-accent)",
    textDecoration: "none",
    cursor: "pointer",
  },
  ".cm-wikilink:hover": {
    textDecoration: "underline",
  },
  ".cm-wikilink-unresolved": {
    textDecoration: "none",
    borderBottom: "1px dashed var(--color-text-accent)",
  },
  ".cm-markdown-syntax": {
    display: "none !important",
  },
});
