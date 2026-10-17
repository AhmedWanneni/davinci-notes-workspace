import type { Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  listExtension,
  listIndentKeymap,
  livePreviewExtension,
  softLineBreakExtension,
  tagExtension,
  tagTheme,
} from "@app/editor";

/**
 * Builds the CodeMirror 6 extension set for the mobile editor.
 * Reuses the shared live-preview decorations, syntax highlighting, and themes.
 */
export function createMobileEditorExtensions(
  extraExtensions: Extension[] = [],
): Extension[] {
  return [
    history(),
    drawSelection(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    keymap.of([...historyKeymap, ...listIndentKeymap, ...defaultKeymap]),
    syntaxHighlighting(editorHighlightStyle),
    editorTheme,
    tagTheme,
    softLineBreakExtension,
    markdown({
      extensions: [Strikethrough, highlightExtension],
    }),
    livePreviewExtension,
    listExtension(),
    tagExtension(),
    EditorView.theme({
      "&": {
        height: "100%",
        outline: "none",
        fontSize: "16px",
      },
      ".cm-scroller": {
        height: "100%",
        overflow: "auto",
        fontFamily: "inherit",
      },
      ".cm-content": {
        minHeight: "100%",
        paddingBottom: "300px",
      },
    }),
    ...extraExtensions,
  ];
}
