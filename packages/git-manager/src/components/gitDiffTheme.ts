import { EditorView } from "@codemirror/view";

export const gitDiffTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "20px",
    lineHeight: "1.5",
  },
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": {
    fontSize: "20px",
    lineHeight: "1.5",
  },
  ".cm-line": {
    fontSize: "20px",
    lineHeight: "1.5",
  },
  ".cm-mergeView": {
    display: "flex",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    fontSize: "20px",
  },
  ".cm-mergeViewEditors": {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    fontSize: "20px",
  },
  ".cm-mergeViewEditor": {
    flex: 1,
    minWidth: 0,
    height: "100%",
    overflow: "hidden",
    fontSize: "20px",
  },
  ".cm-mergeViewEditor:first-child": {
    borderRight: "1px solid var(--color-border)",
  },
  ".cm-mergeSpacer": {
    background:
      "repeating-linear-gradient(-45deg, var(--color-bg-secondary), var(--color-bg-secondary) 4px, var(--color-bg-base) 4px, var(--color-bg-base) 8px)",
    opacity: "0.8",
  },
  ".cm-changedLine": { backgroundColor: "var(--color-bg-hover)" },
  ".cm-changedText": { backgroundColor: "var(--color-bg-tertiary)" },
  ".cm-gutterElement": {
    color: "var(--color-text-faint)",
    fontSize: "20px",
    lineHeight: "1.5",
    padding: "0 12px 0 8px",
  },
});
