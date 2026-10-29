import { EditorView } from "@codemirror/view";

export const embedAudioTheme = EditorView.theme({
  ".cm-file-audio-embed": {
    display: "block",
    margin: "var(--space-3) 0",
    padding: "var(--space-3)",
    border: "var(--border-width-thin) solid var(--color-border-normal)",
    borderRadius: "var(--border-radius-md)",
    backgroundColor: "var(--color-bg-secondary)",
  },
  ".cm-file-audio-embed__header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "var(--space-2)",
  },
  ".cm-file-audio-embed__title-group": {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    minWidth: "0",
  },
  ".cm-file-audio-embed__icon": {
    fontSize: "var(--type-scale-sm)",
  },
  ".cm-file-audio-embed__title": {
    fontSize: "var(--type-scale-xs)",
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ".cm-file-audio-embed__rerun-btn": {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: "var(--type-weight-medium)",
    border: "var(--border-width-thin) solid var(--color-border-normal)",
    borderRadius: "var(--border-radius-sm)",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-text-accent)",
    cursor: "pointer",
  },
  ".cm-file-audio-embed__rerun-btn:hover": {
    backgroundColor: "var(--color-bg-status-accent)",
    borderColor: "var(--color-border-focus)",
  },
  ".cm-file-audio-embed__player": {
    width: "100%",
    height: "36px",
    display: "block",
  },
});
