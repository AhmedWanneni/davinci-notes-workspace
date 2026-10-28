import { EditorView } from "@codemirror/view";
export { editorHighlightStyle } from "./editorHighlightStyle";

export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor)",
    // This is a vault-scoped runtime setting, rather than a theme token.
    fontSize: "var(--editor-font-size)",
    lineHeight: "var(--editor-obsidian-body-line-height)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-attachment-drag-over": {
    outline: "var(--border-width-thin) dashed var(--color-text-accent)",
    outlineOffset: "calc(-1 * var(--border-width-thin))",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "var(--editor-obsidian-body-line-height)",
  },
  ".cm-content": {
    padding:
      "var(--space-6) var(--space-8) var(--editor-content-padding-bottom)",
    caretColor: "var(--color-editor-cursor, var(--color-text-normal))",
  },
  ".cm-line": {
    paddingLeft: "var(--editor-obsidian-content-line-padding-inline)",
    paddingRight: "var(--editor-obsidian-content-line-padding-inline)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-editor-cursor, var(--color-text-normal))",
    borderLeftWidth: "2px",
  },
  ".cm-dropCursor": {
    borderLeftColor: "var(--color-editor-cursor, var(--color-text-normal))",
    borderLeftWidth: "2px",
  },
  ".cm-fat-cursor": {
    position: "absolute",
    backgroundColor: "var(--color-editor-cursor, #000000) !important",
    color: "var(--color-bg-primary, #ffffff) !important",
    border: "none",
    whiteSpace: "pre",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    backgroundColor: "transparent !important",
    outline: "solid 1px var(--color-editor-cursor, #000000) !important",
    color: "inherit !important",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--color-bg-active) !important",
    },
  ".cm-activeLine": {
    backgroundColor: "transparent",
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
  },
  ".cm-activeLine .cm-markdown-syntax, .cm-activeLine .cm-markdown-syntax *": {
    color: "var(--color-text-faint)",
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
    fontSize: "var(--editor-obsidian-body-font-size)",
    lineHeight: "var(--editor-obsidian-body-line-height)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "var(--editor-obsidian-body-line-height)",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "var(--space-2) var(--space-3)",
  },
  ".cm-line": {
    paddingLeft: "var(--editor-obsidian-content-line-padding-inline)",
    paddingRight: "var(--editor-obsidian-content-line-padding-inline)",
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
