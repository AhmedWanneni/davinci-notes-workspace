import { EditorView } from "@codemirror/view";

const sharedMermaidTheme = {
  ".cm-mermaid-diagram": {
    display: "block",
    overflowX: "auto",
    padding: "var(--space-3) 0",
    textAlign: "center",
  },
  ".cm-mermaid-diagram svg": {
    maxWidth: "100%",
    height: "auto",
  },
  ".cm-mermaid-internal-link": {
    cursor: "pointer",
  },
  ".cm-mermaid-error": {
    color: "var(--color-text-error)",
    border: "var(--border-width-thin) dashed var(--color-border-subtle)",
    textAlign: "left",
  },
};

export const mermaidTheme = EditorView.theme(sharedMermaidTheme);
