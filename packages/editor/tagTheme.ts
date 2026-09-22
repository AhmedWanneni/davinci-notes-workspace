import { EditorView } from "@codemirror/view";

export const tagTheme = EditorView.theme({
  ".cm-tag": {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: "0 var(--space-1)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRadius: "var(--border-radius-sm)",
    backgroundColor: "var(--color-bg-secondary)",
    color: "var(--color-text-accent)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  ".cm-tag:hover": {
    backgroundColor: "var(--color-bg-hover)",
  },
});
