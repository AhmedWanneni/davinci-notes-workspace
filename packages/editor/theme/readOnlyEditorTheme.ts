import { EditorView } from "@codemirror/view";

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
      backgroundColor:
        "color-mix(in srgb, var(--editor-obsidian-color-link, var(--color-text-accent, #7c3aed)) 25%, transparent) !important",
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
