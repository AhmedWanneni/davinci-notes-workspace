import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { editorHighlightStyle, readOnlyEditorTheme } from "../theme";
import {
  highlightExtension,
  listExtension,
  livePreviewExtension,
  softLineBreakExtension,
} from "../live-preview";
import { tableExtension } from "../blocks/table";
import { mermaidExtension } from "../blocks/mermaid";
import { mathExtension } from "../blocks/math";
import { imageExtension } from "./imageExtension";
import {
  htmlBlockExtension,
  htmlInlineExtension,
} from "../blocks/html";
import type { NoteEmbedOptions } from "./noteEmbedTypes";

export function createReadOnlyEmbedView(
  parent: HTMLElement,
  doc: string,
  options: NoteEmbedOptions,
  embedExtensionFactory?: (options: NoteEmbedOptions) => Extension,
): EditorView {
  const childOptions: NoteEmbedOptions = {
    ...options,
    isReadOnly: true,
  };

  const extensions = [
    readOnlyEditorTheme,
    EditorView.lineWrapping,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
    markdown({
      extensions: [Strikethrough, highlightExtension],
    }),
    syntaxHighlighting(editorHighlightStyle),
    livePreviewExtension,
    softLineBreakExtension,
    listExtension({ isReadOnly: true }),
    tableExtension({ isReadOnly: true }),
    mermaidExtension({
      isReadOnly: true,
      onLinkClick: options.onLinkClick ?? (() => {}),
    }),
    mathExtension({ isReadOnly: true }),
    imageExtension({ isReadOnly: true }),
    htmlBlockExtension(),
    htmlInlineExtension(),
    ...(embedExtensionFactory ? [embedExtensionFactory(childOptions)] : []),
  ];

  const state = EditorState.create({
    doc,
    extensions,
  });

  return new EditorView({
    state,
    parent,
  });
}
