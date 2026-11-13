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
  markdownAnnotationsExtension,
  markdownAnnotationTheme,
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
    markdownAnnotationTheme,
    markdownAnnotationsExtension(),
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
        direction: "inherit",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Geeza Pro', 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', 'SF Pro Text', 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, system-ui",
      },
      ".cm-scroller": {
        height: "100%",
        overflow: "auto",
        direction: "inherit",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Geeza Pro', 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', 'SF Pro Text', 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, system-ui",
      },
      ".cm-content": {
        minHeight: "100%",
        paddingBottom: "300px",
        direction: "inherit",
        unicodeBidi: "plaintext",
        textAlign: "start",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Geeza Pro', 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', 'SF Pro Text', 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, system-ui",
      },
      ".cm-line": {
        direction: "inherit",
        unicodeBidi: "plaintext",
        textAlign: "start",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Geeza Pro', 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', 'SF Pro Text', 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, system-ui",
        fontSize: "16px",
        lineHeight: "1.7",
      },
      ".cm-heading-1": {
        fontSize: "1.802em",
        fontWeight: "700",
        lineHeight: "1.25",
      },
      ".cm-heading-2": {
        fontSize: "1.462em",
        fontWeight: "680",
        lineHeight: "1.25",
      },
      ".cm-heading-3": {
        fontSize: "1.318em",
        fontWeight: "660",
        lineHeight: "1.3",
      },
      ".cm-heading-4": {
        fontSize: "1.188em",
        fontWeight: "640",
        lineHeight: "1.4",
      },
      ".cm-heading-5": {
        fontSize: "1.076em",
        fontWeight: "620",
        lineHeight: "1.5",
      },
      ".cm-heading-6": {
        fontSize: "1em",
        fontWeight: "600",
        lineHeight: "1.5",
      },
    }),
    ...extraExtensions,
  ];
}
