import { EditorView } from "@codemirror/view";

const sharedAnnotations = {
  ".cm-blockquote-line": {
    borderLeft: "var(--border-width-thick) solid var(--color-text-accent)",
    paddingLeft: "var(--space-3)",
    paddingTop: "var(--space-1)",
    paddingBottom: "var(--space-1)",
    backgroundColor: "var(--color-bg-surface)",
  },
  ".cm-heading-line": {
    paddingTop: "var(--space-2)",
    paddingBottom: "var(--space-2)",
  },
  ".cm-heading-1": {
    paddingTop: "var(--space-4)",
    paddingBottom: "var(--space-1)",
  },
  ".cm-heading-2": {
    paddingTop: "var(--space-4)",
    paddingBottom: "var(--space-1)",
  },
  ".cm-heading-3": {
    paddingTop: "var(--space-3)",
    paddingBottom: "var(--space-1)",
  },
  ".cm-heading-4": {
    paddingTop: "var(--space-3)",
    paddingBottom: "var(--space-1)",
  },
  ".cm-heading-5, .cm-heading-6": {
    paddingTop: "var(--space-2)",
    paddingBottom: "var(--space-1)",
  },
  ".cm-content > .cm-heading-line:first-child": { paddingTop: "0" },
  ".cm-code-block-line": {
    backgroundColor: "var(--color-bg-secondary)",
    paddingTop: "var(--space-1)",
    paddingBottom: "var(--space-1)",
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
