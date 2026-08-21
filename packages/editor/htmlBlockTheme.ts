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
  ".cm-iframe-placeholder": {
    color: "var(--color-text-normal)",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    padding: "var(--space-2) var(--space-3)",
    cursor: "pointer",
  },
  ".cm-iframe-embed": {
    display: "block",
    width: "100%",
    minHeight: "var(--space-8)",
    border: "0",
  },
  ".cm-youtube-facade": {
    position: "relative",
    display: "block",
    width: "100%",
    padding: "0",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    backgroundColor: "var(--color-bg-secondary)",
    cursor: "pointer",
  },
  ".cm-youtube-facade img": {
    display: "block",
    width: "100%",
  },
  ".cm-youtube-facade__play": {
    position: "absolute",
    inset: "50% auto auto 50%",
    transform: "translate(-50%, -50%)",
    padding: "var(--space-1) var(--space-2)",
    color: "var(--color-text-normal)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    backgroundColor: "var(--color-bg-primary)",
  },
  ".cm-youtube-facade__fallback": {
    display: "block",
    padding: "var(--space-6)",
    color: "var(--color-text-muted)",
  },
  ".cm-tweet-card": {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
    maxWidth: "var(--space-8)",
    padding: "var(--space-2) var(--space-3)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-tweet-card__author": {
    fontWeight: "var(--type-weight-semibold)",
  },
  ".cm-tweet-card__text": {
    whiteSpace: "normal",
  },
  ".cm-tweet-card__link": {
    color: "var(--color-text-accent)",
  },
});
