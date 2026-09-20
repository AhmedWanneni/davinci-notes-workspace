import { EditorView } from "@codemirror/view";

const sharedAnnotations = {
  ".cm-blockquote-line": {
    borderLeft: "var(--border-width-thick) solid var(--color-text-accent)",
    paddingLeft: "var(--space-3)",
  },
  ".cm-heading-line": {
    paddingTop: "var(--editor-heading-h5-space-above)",
    paddingBottom: "var(--editor-heading-h5-space-below)",
  },
  ".cm-heading-1": {
    paddingTop: "var(--editor-heading-h1-space-above)",
    paddingBottom: "var(--editor-heading-h1-space-below)",
  },
  ".cm-heading-2": {
    paddingTop: "var(--editor-heading-h2-space-above)",
    paddingBottom: "var(--editor-heading-h2-space-below)",
  },
  ".cm-heading-3": {
    paddingTop: "var(--editor-heading-h3-space-above)",
    paddingBottom: "var(--editor-heading-h3-space-below)",
  },
  ".cm-heading-4": {
    paddingTop: "var(--editor-heading-h4-space-above)",
    paddingBottom: "var(--editor-heading-h4-space-below)",
  },
  ".cm-heading-5, .cm-heading-6": {
    paddingTop: "var(--editor-heading-h5-space-above)",
    paddingBottom: "var(--editor-heading-h5-space-below)",
  },
  ".cm-content > .cm-heading-line:first-child": { paddingTop: "0" },
  ".cm-code-block-line": {
    backgroundColor: "var(--color-bg-secondary)",
    paddingTop: "var(--editor-code-block-padding-y)",
    paddingBottom: "var(--editor-code-block-padding-y)",
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
