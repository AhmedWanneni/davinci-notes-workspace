import { EditorView } from "@codemirror/view";

export const htmlInlineTheme = EditorView.theme({
  ".cm-inline-html s": { textDecoration: "line-through" },
  ".cm-inline-html u": { textDecoration: "underline" },
  ".cm-inline-html": { display: "inline" },
});
