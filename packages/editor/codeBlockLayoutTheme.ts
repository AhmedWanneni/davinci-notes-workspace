import { EditorView } from "@codemirror/view";

/** Preserve horizontal scrolling for long code lines while prose wraps. */
export const codeBlockLayoutTheme = EditorView.theme({
  ".cm-line.cm-code-block": {
    whiteSpace: "pre",
    overflowWrap: "normal",
  },
});
