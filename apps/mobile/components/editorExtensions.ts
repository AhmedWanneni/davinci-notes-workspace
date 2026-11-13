import { Compartment, type Extension } from "@codemirror/state";
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
  handleListEnter,
  frontmatterHideExtension,
  livePreviewExtension,
  markdownAnnotationsExtension,
  markdownAnnotationTheme,
  softLineBreakExtension,
  tagExtension,
  tagTheme,
} from "@app/editor";

export function handleNoteModeEnter(view: EditorView): boolean {
  const sel = view.state.selection.main;
  const line = view.state.doc.lineAt(sel.head);
  const text = line.text;

  // When user typed '-' alone (or with leading whitespace) and presses Enter:
  // make it a bullet list item and continue with '- ' on the next line
  const matchDashAlone = /^(\s*)-(.*)$/.exec(text);
  if (matchDashAlone && !/^\s*-\s+/.test(text)) {
    const indent = matchDashAlone[1];
    const rest = matchDashAlone[2].trim();
    const formattedLine = `${indent}- ${rest}`;
    const nextLine = `\n${indent}- `;
    view.dispatch({
      changes: [
        { from: line.from, to: line.to, insert: formattedLine },
        { from: line.from + formattedLine.length, insert: nextLine },
      ],
      selection: { anchor: line.from + formattedLine.length + nextLine.length },
      scrollIntoView: true,
      userEvent: "input",
    });
    return true;
  }

  return handleListEnter(view);
}

export function handleTextModeEnter(view: EditorView): boolean {
  const sel = view.state.selection.main;
  const line = view.state.doc.lineAt(sel.head);
  const text = line.text;

  // In text mode: bullet point is normal '-' list, not circle bullet points
  const matchDashList = /^(\s*)-\s+(.*)$/.exec(text);
  if (matchDashList) {
    const indent = matchDashList[1];
    const rest = matchDashList[2].trim();
    if (rest.length === 0) {
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: "" },
        selection: { anchor: line.from },
        scrollIntoView: true,
        userEvent: "input",
      });
      return true;
    }
    const nextLine = `\n${indent}- `;
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: nextLine },
      selection: { anchor: sel.from + nextLine.length },
      scrollIntoView: true,
      userEvent: "input",
    });
    return true;
  }

  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: "\n" },
    selection: { anchor: sel.from + 1 },
    scrollIntoView: true,
    userEvent: "input",
  });
  return true;
}

export function getMobileModeExtensions(editorMode: "note" | "text" = "note"): Extension[] {
  const isText = editorMode === "text";
  const modeKeymap = isText
    ? keymap.of([{ key: "Enter", run: handleTextModeEnter }, ...historyKeymap, ...defaultKeymap])
    : keymap.of([{ key: "Enter", run: handleNoteModeEnter }, ...historyKeymap, ...listIndentKeymap.filter((k) => k.key !== "Enter"), ...defaultKeymap]);

  if (isText) return [modeKeymap];

  return [
    modeKeymap,
    tagTheme,
    markdownAnnotationTheme,
    markdownAnnotationsExtension(),
    livePreviewExtension,
    listExtension(),
    tagExtension(),
  ];
}

/**
 * Builds the CodeMirror 6 extension set for the mobile editor.
 * In 'note' mode: bullet list continuation, bullet widgets, live preview decorations.
 * In 'text' mode: plain text editing, '-' stays as '-', no list continuation or widgets.
 */
export function createMobileEditorExtensions(
  extraExtensions: Extension[] = [],
  editorMode: "note" | "text" = "note",
  modeCompartment?: Compartment,
): Extension[] {
  const modeExts = modeCompartment
    ? modeCompartment.of(getMobileModeExtensions(editorMode))
    : getMobileModeExtensions(editorMode);

  return [
    history(),
    drawSelection(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    modeExts,
    syntaxHighlighting(editorHighlightStyle),
    editorTheme,
    softLineBreakExtension,
    ...frontmatterHideExtension(),
    markdown({
      extensions: [Strikethrough, highlightExtension],
    }),
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
      ".cm-heading-1": { fontSize: "1.802em", fontWeight: "700", lineHeight: "1.25" },
      ".cm-heading-2": { fontSize: "1.462em", fontWeight: "680", lineHeight: "1.25" },
      ".cm-heading-3": { fontSize: "1.318em", fontWeight: "660", lineHeight: "1.3" },
      ".cm-heading-4": { fontSize: "1.188em", fontWeight: "640", lineHeight: "1.4" },
      ".cm-heading-5": { fontSize: "1.076em", fontWeight: "620", lineHeight: "1.5" },
      ".cm-heading-6": { fontSize: "1em", fontWeight: "600", lineHeight: "1.5" },
    }),
    ...extraExtensions,
  ];
}
