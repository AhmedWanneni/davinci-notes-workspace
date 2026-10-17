import { EditorView } from "@codemirror/view";

export const reminderTheme = EditorView.theme({
  ".cm-reminder-chip": {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: "0 var(--space-2)",
    margin: "0 var(--space-1)",
    border: "var(--border-width-thin) solid var(--color-border-normal)",
    borderRadius: "var(--border-radius-sm)",
    backgroundColor: "var(--color-bg-secondary)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--type-scale-xs)",
    lineHeight: "var(--type-leading-normal)",
    cursor: "pointer",
    userSelect: "none",
    verticalAlign: "baseline",
    whiteSpace: "nowrap",
  },
  ".cm-reminder-chip:hover": {
    backgroundColor: "var(--color-bg-hover)",
    borderColor: "var(--color-border-focus)",
  },
  ".cm-reminder-icon": {
    display: "inline-flex",
    color: "var(--color-text-muted)",
    flexShrink: "0",
  },
  ".cm-reminder-chip:hover .cm-reminder-icon": {
    color: "var(--color-text-normal)",
  },
  ".cm-reminder-chip.cm-reminder-overdue": {
    backgroundColor: "var(--color-bg-status-error)",
    borderColor: "var(--color-border-status-error)",
    color: "var(--color-text-error)",
  },
  ".cm-reminder-chip.cm-reminder-overdue .cm-reminder-icon": {
    color: "var(--color-text-error)",
  },
  ".cm-reminder-chip.cm-reminder-done": {
    opacity: "0.6",
    color: "var(--color-text-muted)",
    textDecoration: "line-through",
    borderColor: "var(--color-border-subtle)",
  },
});
