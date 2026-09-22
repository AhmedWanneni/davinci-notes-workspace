import { EditorView } from "@codemirror/view";

export const mathTheme = EditorView.theme({
  ".cm-math-block": {
    display: "block",
    padding: "var(--space-3) 0",
    textAlign: "center",
  },
  ".cm-math-inline": {
    display: "inline-block",
    verticalAlign: "middle",
  },
  ".cm-math-error": {
    color: "var(--color-text-error)",
    border: "var(--border-width-thin) dashed var(--color-border-subtle)",
  },
});
