import { EditorView } from "@codemirror/view";

const sharedTableTheme = {
  ".cm-table-row": {
    display: "flex",
    alignItems: "stretch",
    width: "100%",
    fontSize: "0",
    borderLeft: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderRight: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-table-header": {
    fontWeight: "var(--type-weight-semibold)",
    borderTop: "var(--border-width-thin) solid var(--color-border-subtle)",
    borderBottom: "var(--border-width-thin) solid var(--color-border-subtle)",
  },
  ".cm-table-separator": {
    display: "none",
    minHeight: "0",
  },
  ".cm-table-separator.cm-activeLine": {
    display: "flex",
  },
  ".cm-table-delimiter": {
    display: "none",
  },
  ".cm-activeLine .cm-table-delimiter": {
    display: "inline",
    opacity: "0.5",
  },
  ".cm-table-cell": {
    display: "block",
    flex: "1 1 0",
    minWidth: "0",
    padding: "0 var(--space-2)",
    borderRight: "var(--border-width-thin) solid var(--color-border-subtle)",
    fontSize: "var(--type-scale-base)",
    whiteSpace: "inherit",
    overflowWrap: "anywhere",
  },
  ".cm-table-cell:last-child": {
    borderRight: "0",
  },
  ".cm-table-cell-left": { textAlign: "left" },
  ".cm-table-cell-center": { textAlign: "center" },
  ".cm-table-cell-right": { textAlign: "right" },
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
