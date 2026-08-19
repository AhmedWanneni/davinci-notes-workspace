import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
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
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
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
  ".cm-link": {
    color: "var(--color-text-accent)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-link:hover": {
    textDecoration: "underline",
  },
  ".cm-link-unresolved": {
    textDecoration: "none",
    borderBottom: "1px dashed var(--color-text-accent)",
  },
  ".cm-link-external": {
    color: "var(--color-text-accent)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-image-embed": {
    display: "inline-block",
    maxWidth: "100%",
    verticalAlign: "middle",
    margin: "var(--space-1, 4px) 0",
  },
  ".cm-image-embed img": {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    borderRadius: "var(--border-radius-sm, 2px)",
  },
  ".cm-image-error": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-2, 8px)",
    border: "1px dashed var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm, 2px)",
    color: "var(--color-text-muted)",
    fontSize: "var(--type-scale-xs, 12px)",
  },
  ".cm-list-bullet, .cm-list-ordered": {
    display: "inline-block",
    minWidth: "var(--space-4)",
    color: "var(--color-text-muted)",
  },
  ".cm-list-bullet": {
    textAlign: "center",
  },
  ".cm-task-checkbox": {
    accentColor: "var(--color-text-accent)",
    cursor: "pointer",
    margin: "0 var(--space-1) 0 0",
    verticalAlign: "middle",
  },
  ".cm-task-checkbox:disabled": {
    cursor: "default",
  },
  ".cm-task-completed": {
    color: "var(--color-text-muted)",
    textDecoration: "line-through",
  },
  ".cm-markdown-syntax": {
    display: "none !important",
  },
  ".cm-activeLine .cm-markdown-syntax": {
    display: "inline !important",
    opacity: 0.5,
  },
  ".cm-hr-line": {
    position: "relative",
    padding: "var(--space-3) 0",
  },
  ".cm-hr-line::after": {
    content: '""',
    position: "absolute",
    left: "0",
    right: "0",
    top: "50%",
    height: "var(--border-width-thin)",
    backgroundColor: "var(--color-border-subtle)",
    pointerEvents: "none",
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
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
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
  ".cm-link": {
    color: "var(--color-text-accent)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-link:hover": {
    textDecoration: "underline",
  },
  ".cm-link-unresolved": {
    textDecoration: "none",
    borderBottom: "1px dashed var(--color-text-accent)",
  },
  ".cm-link-external": {
    color: "var(--color-text-accent)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-image-embed": {
    display: "inline-block",
    maxWidth: "100%",
    verticalAlign: "middle",
    margin: "var(--space-1, 4px) 0",
  },
  ".cm-image-embed img": {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    borderRadius: "var(--border-radius-sm, 2px)",
  },
  ".cm-image-error": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-2, 8px)",
    border: "1px dashed var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm, 2px)",
    color: "var(--color-text-muted)",
    fontSize: "var(--type-scale-xs, 12px)",
  },
  ".cm-list-bullet, .cm-list-ordered": {
    display: "inline-block",
    minWidth: "var(--space-4)",
    color: "var(--color-text-muted)",
  },
  ".cm-list-bullet": {
    textAlign: "center",
  },
  ".cm-task-checkbox": {
    accentColor: "var(--color-text-accent)",
    cursor: "pointer",
    margin: "0 var(--space-1) 0 0",
    verticalAlign: "middle",
  },
  ".cm-task-checkbox:disabled": {
    cursor: "default",
  },
  ".cm-task-completed": {
    color: "var(--color-text-muted)",
    textDecoration: "line-through",
  },
  ".cm-markdown-syntax": {
    display: "none !important",
  },
  ".cm-hr-line": {
    position: "relative",
    padding: "var(--space-2) 0",
  },
  ".cm-hr-line::after": {
    content: '""',
    position: "absolute",
    left: "0",
    right: "0",
    top: "50%",
    height: "var(--border-width-thin)",
    backgroundColor: "var(--color-border-subtle)",
    pointerEvents: "none",
  },
});
