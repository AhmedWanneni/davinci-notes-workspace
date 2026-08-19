import { EditorView } from "@codemirror/view";

const sharedAnnotations = {
  ".cm-blockquote-line": {
    borderLeft: "var(--border-width-thick) solid var(--color-text-accent)",
    paddingLeft: "var(--space-3)",
  },
  ".cm-footnote-reference": {
    color: "var(--color-text-accent)",
    cursor: "default",
    fontSize: "var(--type-scale-xs)",
  },
  ".cm-footnote-definition-marker": {
    color: "var(--color-text-accent)",
    fontWeight: "var(--type-weight-semibold)",
    marginRight: "var(--space-1)",
  },
};

export const markdownAnnotationTheme = EditorView.theme({
  ...sharedAnnotations,
  ".cm-markdown-comment": {
    color: "var(--color-text-muted)",
    backgroundColor: "var(--color-bg-secondary)",
  },
});

export const readOnlyMarkdownAnnotationTheme = EditorView.theme({
  ...sharedAnnotations,
  ".cm-markdown-comment": {
    display: "none",
  },
});
