import { EditorView } from "@codemirror/view";
export { editorHighlightStyle } from "./editorHighlightStyle";

export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor, var(--font-text))",
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
    overflowY: "auto",
    overflowX: "hidden",
    height: "100%",
    paddingBottom: "160px",
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
    display: "inline-block",
    boxSizing: "border-box",
    minWidth: "0.6em",
    minHeight: "1.2em",
    textAlign: "center",
    whiteSpace: "pre",
    overflow: "hidden",
    backgroundColor:
      "var(--color-editor-cursor, var(--color-text-normal)) !important",
    color: "var(--color-bg-primary) !important",
    border: "none",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    backgroundColor: "transparent !important",
    outline:
      "solid 1px var(--color-editor-cursor, var(--color-text-normal)) !important",
    color: "inherit !important",
  },
  "[data-vim-monospace='true'] & .cm-fat-cursor, &.cm-vim-monospace .cm-fat-cursor, [data-vim-monospace='true'] .cm-fat-cursor":
    {
      width: "1ch !important",
      minWidth: "1ch !important",
      maxWidth: "1ch !important",
    },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--color-bg-active) !important",
    },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-wikilink": {
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "none",
    cursor: "pointer",
  },
  ".cm-wikilink:hover": {
    textDecoration: "underline",
  },
  ".cm-wikilink-unresolved": {
    textDecoration: "none",
    borderBottom:
      "1px dashed var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
  },
  ".cm-link": {
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
  },
  ".cm-link:hover": {
    textDecoration: "underline",
  },
  ".cm-link-unresolved": {
    textDecoration: "none",
    borderBottom:
      "1px dashed var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
  },
  ".cm-link-external": {
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
  },
  ".cm-link-external::after": {
    content: '""',
    display: "inline-block",
    width: "13px",
    height: "13px",
    marginLeft: "3px",
    verticalAlign: "-1.5px",
    backgroundImage:
      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/%3E%3Cpolyline points='15 3 21 3 21 9'/%3E%3Cline x1='10' y1='14' x2='21' y2='3'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain",
    opacity: "0.85",
    textDecoration: "none",
  },
  ".cm-list-bullet, .cm-list-ordered": {
    display: "inline-block",
    minWidth: "var(--space-4)",
    color: "var(--color-text-muted)",
  },
  ".cm-list-ordered": {
    width: "auto",
    whiteSpace: "nowrap",
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
    fontFamily: "var(--font-editor, var(--font-text))",
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
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "none",
    cursor: "pointer",
  },
  ".cm-wikilink:hover": {
    textDecoration: "underline",
  },
  ".cm-wikilink-unresolved": {
    textDecoration: "none",
    borderBottom:
      "1px dashed var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
  },
  ".cm-link": {
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
  },
  ".cm-link:hover": {
    textDecoration: "underline",
  },
  ".cm-link-unresolved": {
    textDecoration: "none",
    borderBottom:
      "1px dashed var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
  },
  ".cm-link-external": {
    color:
      "var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed))",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
  },
  ".cm-link-external::after": {
    content: '""',
    display: "inline-block",
    width: "13px",
    height: "13px",
    marginLeft: "3px",
    verticalAlign: "-1.5px",
    backgroundImage:
      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/%3E%3Cpolyline points='15 3 21 3 21 9'/%3E%3Cline x1='10' y1='14' x2='21' y2='3'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain",
    opacity: "0.85",
    textDecoration: "none",
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
