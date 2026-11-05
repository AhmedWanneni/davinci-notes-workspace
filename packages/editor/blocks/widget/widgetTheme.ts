import { EditorView } from "@codemirror/view";

export const widgetTheme = EditorView.theme({
  ".cm-widget-block": {
    margin: "10px 0",
    borderRadius: "var(--border-radius-md, 8px)",
    border: "1px solid var(--color-border-subtle, #333)",
    backgroundColor: "var(--color-bg-primary, #1e1e1e)",
    overflow: "hidden",
    position: "relative",
    display: "block",
  },
  ".cm-widget-iframe": {
    width: "100%",
    border: "none",
    display: "block",
    backgroundColor: "transparent",
    transition: "height 0.15s ease",
  },
  ".cm-widget-placeholder": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    backgroundColor: "var(--color-bg-secondary, #252525)",
    color: "var(--color-text-muted, #888)",
    fontSize: "12px",
    fontFamily: "var(--font-ui, sans-serif)",
    userSelect: "none",
  },
  ".cm-widget-placeholder-text": {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    opacity: 0.8,
  },
  ".cm-widget-error": {
    padding: "12px 16px",
    color: "var(--color-text-error, #f87171)",
    backgroundColor: "var(--color-bg-error-subtle, rgba(239, 68, 68, 0.1))",
    fontSize: "12px",
    fontFamily: "var(--font-mono, monospace)",
  },
});
