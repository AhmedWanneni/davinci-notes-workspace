import { EditorView } from "@codemirror/view";

export const htmlBlockTheme = EditorView.theme({
  ".cm-html-block": {
    display: "block",
    overflowX: "auto",
  },
  ".cm-html-block table": {
    width: "100%",
    borderCollapse: "collapse",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-html-block tr": {
    borderBottom: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-html-block tr:last-child": {
    borderBottom: "0",
  },
  ".cm-html-block td": {
    padding: "var(--space-1) var(--space-2)",
    borderRight: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-html-block td:last-child": {
    borderRight: "0",
  },
});
