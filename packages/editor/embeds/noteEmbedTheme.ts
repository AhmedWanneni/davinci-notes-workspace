import { EditorView } from "@codemirror/view";

export const noteEmbedTheme = EditorView.theme({
  ".cm-note-embed": {
    display: "block",
    margin: "var(--space-2) 0",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm)",
    backgroundColor: "var(--color-bg-secondary)",
    overflow: "hidden",
  },
  ".cm-note-embed__header": {
    display: "flex",
    alignItems: "center",
    padding: "var(--space-1) var(--space-3)",
    borderBottom: "var(--border-width-thin) solid var(--color-border-subtle)",
    backgroundColor: "var(--color-bg-secondary-alt)",
    fontSize: "var(--type-scale-xs)",
    color: "var(--color-text-muted)",
  },
  ".cm-note-embed__title": {
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-accent)",
    cursor: "pointer",
  },
  ".cm-note-embed__title:hover": {
    textDecoration: "underline",
  },
  ".cm-note-embed__body": {
    padding: "var(--space-2) var(--space-3)",
  },
  ".cm-note-embed__muted": {
    color: "var(--color-text-muted)",
    fontStyle: "italic",
    padding: "var(--space-2) var(--space-3)",
  },
  ".cm-note-embed-box": {
    display: "block",
    padding: "var(--space-2) var(--space-3)",
    margin: "var(--space-2) 0",
    borderRadius: "var(--border-radius-sm)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-note-embed-circular": {
    color: "var(--color-text-warning)",
    borderColor: "var(--color-border-status-warning)",
    backgroundColor: "var(--color-bg-status-warning)",
  },
  ".cm-note-embed-placeholder": {
    color: "var(--color-text-muted)",
    backgroundColor: "var(--color-bg-secondary)",
  },
  ".cm-note-embed__show-more": {
    display: "block",
    margin: "var(--space-2) 0 0",
    padding: "var(--space-1) var(--space-2)",
    background: "transparent",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm)",
    color: "var(--color-text-accent)",
    fontSize: "var(--type-scale-xs)",
    cursor: "pointer",
  },
});
