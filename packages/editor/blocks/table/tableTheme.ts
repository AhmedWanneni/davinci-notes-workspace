import { EditorView } from "@codemirror/view";

const sharedTableTheme = {
  ".cm-table-row": {
    display: "flex",
    alignItems: "stretch",
    minHeight: "36px",
    width: "100%",
    borderLeft: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRight: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderBottom: "var(--border-width-thin) solid var(--color-border-subtle)",
    transition: "background-color 0.1s ease",
  },
  ".cm-table-row:not(.cm-table-header):hover": {
    backgroundColor: "transparent",
  },
  ".cm-table-header": {
    fontWeight: "var(--type-weight-semibold)",
    backgroundColor: "transparent",
    color: "var(--color-text-normal)",
    borderTop: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderBottom: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderTopLeftRadius: "var(--radius-sm, 6px)",
    borderTopRightRadius: "var(--radius-sm, 6px)",
    position: "relative",
  },
  ".cm-table-code-btn": {
    position: "absolute",
    right: "6px",
    top: "6px",
    zIndex: "5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "26px",
    height: "24px",
    padding: "0 6px",
    borderRadius: "4px",
    border: "1px solid var(--color-border-subtle, #e2e8f0)",
    backgroundColor: "var(--color-bg-primary, #ffffff)",
    color: "var(--color-text-muted, #94a3b8)",
    fontSize: "12px",
    fontWeight: "600",
    fontFamily: 'var(--font-mono, "SF Mono", monospace)',
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  ".cm-table-code-btn:hover": {
    backgroundColor: "var(--color-bg-hover, rgba(0, 0, 0, 0.05))",
    color: "var(--color-text-normal, #1e293b)",
  },
  ".cm-table-row-last": {
    borderBottomLeftRadius: "var(--radius-sm, 6px)",
    borderBottomRightRadius: "var(--radius-sm, 6px)",
  },
  ".cm-table-separator": {
    display: "none",
    minHeight: "0",
  },
  ".cm-table-separator.cm-activeLine": {
    display: "flex",
  },
  ".cm-table-delimiter": {
    display: "inline-block",
    width: "0px",
    opacity: "0",
    color: "transparent",
    overflow: "hidden",
    userSelect: "none",
  },
  ".cm-table-cell": {
    display: "inline-flex",
    alignItems: "center",
    flex: "1 1 0",
    minWidth: "80px",
    minHeight: "36px",
    padding: "var(--space-2) var(--space-3)",
    borderRight: "var(--border-width-thin) solid var(--color-border-subtle)",
    fontSize: "var(--type-scale-base)",
    lineHeight: "var(--line-height-base, 1.5)",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    position: "relative",
  },
  ".cm-table-cell-last": {
    borderRight: "0 !important",
  },
  ".cm-table-cell[data-placeholder]::before": {
    content: "attr(data-placeholder)",
    color: "var(--color-text-faint)",
    opacity: "0.45",
    pointerEvents: "none",
    fontStyle: "italic",
  },
  ".cm-table-cell-empty": {
    color: "var(--color-text-faint)",
    cursor: "text",
  },
  ".cm-table-cell-left": {
    textAlign: "left",
    justifyContent: "flex-start",
  },
  ".cm-table-cell-center": {
    textAlign: "center",
    justifyContent: "center",
  },
  ".cm-table-cell-right": {
    textAlign: "right",
    justifyContent: "flex-end",
  },
  ".cm-table-context-menu": {
    position: "absolute",
    zIndex: "10",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-width-thin) solid var(--color-border-subtle)",
    padding: "var(--space-1)",
  },
  ".cm-table-context-menu button": {
    color: "var(--color-text-normal)",
    backgroundColor: "transparent",
    border: "0",
    padding: "var(--space-1) var(--space-2)",
    textAlign: "left",
    cursor: "pointer",
  },
  ".cm-table-context-menu button:hover": {
    backgroundColor: "var(--color-bg-hover)",
  },
};

export const tableTheme = EditorView.theme(sharedTableTheme);
export const readOnlyTableTheme = EditorView.theme(sharedTableTheme);
