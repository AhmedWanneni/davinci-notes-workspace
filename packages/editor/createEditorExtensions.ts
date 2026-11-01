import type { RefObject } from "react";
import type { Extension } from "@codemirror/state";
import { Compartment, Prec } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough, Table } from "@lezer/markdown";
import {
  autocompletion,
  clearSnippet,
  nextSnippetField,
  prevSnippetField,
} from "@codemirror/autocomplete";
import { syntaxHighlighting } from "@codemirror/language";
import {
  editorHighlightStyle,
  editorTheme,
  markdownAnnotationTheme,
  reminderTheme,
  tagTheme,
  slashMenuTheme,
  imageTheme,
} from "./theme";
import {
  autocompleteExtension,
  highlightExtension,
  listExtension,
  listIndentKeymap,
  livePreviewExtension,
  markdownAnnotationsExtension,
  reminderExtension,
  type ReminderClickInfo,
  tagExtension,
  insertHardLineBreak,
  softLineBreakExtension,
} from "./live-preview";
import { getLoadedVimExtension } from "./vim/vimExtension";
import { linkExtension } from "./links";
import {
  embedAudioExtension,
  embedAudioTheme,
  embedImageExtension,
  imageExtension,
  noteEmbedExtension,
  noteEmbedTheme,
} from "./embeds";
import { codeBlockLanguage, codeBlockLayoutTheme } from "./blocks/code";
import { tableExtension, tableTheme } from "./blocks/table";
import { mermaidExtension, mermaidTheme } from "./blocks/mermaid";
import { mathExtension, mathTheme } from "./blocks/math";
import {
  htmlBlockExtension,
  htmlBlockTheme,
  htmlInlineExtension,
  htmlInlineTheme,
} from "./blocks/html";
import {
  attachmentDropHandler,
  attachmentPasteHandler,
  type PasteAttachmentHandler,
} from "./clipboard";
import type { EditorPluginAdapter } from "./integration";
import { slashMenuSource, slashMenuAddToOptions } from "./insert/SlashMenu";
import { externalDocumentChange } from "./integration";

export interface EditorExtensionConfig {
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  onTagClickRef: RefObject<(tagKey: string) => void>;
  onReminderClickRef: RefObject<
    ((info: ReminderClickInfo) => void) | undefined
  >;
  onPasteAttachmentRef: RefObject<PasteAttachmentHandler | undefined>;
  onAttachmentErrorRef: RefObject<(message: string) => void>;
  resolveMediaUrl?: (path: string) => string;
  loadNoteContent?: (path: string) => Promise<string | null>;
  noteContents?: Readonly<Record<string, string>>;
  slashMenuEnabled?: boolean;
  vimMode?: string | null;
  useVimMode?: boolean;
  strictLineBreaks?: boolean;
  wikilinkCompartment: Compartment;
  autocompleteCompartment: Compartment;
  noteEmbedCompartment: Compartment;
  embedImageCompartment: Compartment;
  embedAudioCompartment?: Compartment;
  vimCompartment: Compartment;
  onChangeRef: RefObject<(value: string) => void>;
  pluginEditorRef: RefObject<EditorPluginAdapter | null>;
}

export function createEditorExtensions(
  config: EditorExtensionConfig,
): Extension[] {
  return [
    editorTheme,
    imageTheme,
    slashMenuTheme,
    markdownAnnotationTheme,
    tableTheme,
    codeBlockLayoutTheme,
    mermaidTheme,
    mathTheme,
    tagTheme,
    htmlBlockTheme,
    htmlInlineTheme,
    EditorView.lineWrapping,
    attachmentPasteHandler(
      (file, position) => config.onPasteAttachmentRef.current!(file, position),
      (message) => config.onAttachmentErrorRef.current!(message),
    ),
    attachmentDropHandler(
      (file, position) => config.onPasteAttachmentRef.current!(file, position),
      (message) => config.onAttachmentErrorRef.current!(message),
    ),
    history(),
    drawSelection(),
    highlightActiveLine(),
    Prec.high(
      config.vimCompartment.of(
        config.useVimMode && getLoadedVimExtension()
          ? getLoadedVimExtension()!
          : [],
      ),
    ),
    keymap.of([
      { key: "Shift-Enter", run: insertHardLineBreak },
      ...defaultKeymap,
      ...historyKeymap,
      { key: "Tab", run: nextSnippetField },
      { key: "Shift-Tab", run: prevSnippetField },
      { key: "Escape", run: clearSnippet },
      ...listIndentKeymap,
    ]),
    markdown({
      extensions: [Table, Strikethrough, highlightExtension],
      codeLanguages: codeBlockLanguage,
    }),
    syntaxHighlighting(editorHighlightStyle),
    livePreviewExtension,
    markdownAnnotationsExtension(),
    ...(config.strictLineBreaks ? [softLineBreakExtension] : []),
    listExtension(),
    tableExtension(),
    mermaidExtension({ onLinkClick: config.onLinkClick }),
    mathExtension(),
    imageExtension(),
    config.embedImageCompartment.of(
      embedImageExtension({
        notePaths: config.notePaths,
        resolveMediaUrl: config.resolveMediaUrl,
      }),
    ),
    embedAudioTheme,
    config.embedAudioCompartment
      ? config.embedAudioCompartment.of(
          embedAudioExtension({
            notePaths: config.notePaths,
            sourcePath: config.sourcePath,
            resolveMediaUrl: config.resolveMediaUrl,
          }),
        )
      : embedAudioExtension({
          notePaths: config.notePaths,
          sourcePath: config.sourcePath,
          resolveMediaUrl: config.resolveMediaUrl,
        }),
    noteEmbedTheme,
    config.noteEmbedCompartment.of(
      noteEmbedExtension({
        notePaths: config.notePaths,
        sourcePath: config.sourcePath,
        onLinkClick: config.onLinkClick,
        resolveMediaUrl: config.resolveMediaUrl,
        loadNoteContent: config.loadNoteContent,
        noteContents: config.noteContents,
      }),
    ),
    tagExtension({
      onTagClick: (tagKey) => config.onTagClickRef.current?.(tagKey),
    }),
    reminderTheme,
    reminderExtension({
      onReminderClick: (info) => config.onReminderClickRef.current?.(info),
    }),
    htmlBlockExtension(),
    htmlInlineExtension(),
    config.wikilinkCompartment.of(
      linkExtension({
        notePaths: config.notePaths,
        sourcePath: config.sourcePath,
        onLinkClick: config.onLinkClick,
        onExternalLinkClick: config.onExternalLinkClick,
      }),
    ),
    config.autocompleteCompartment.of(
      autocompletion({
        addToOptions: slashMenuAddToOptions,
        override: [
          autocompleteExtension({ notePaths: config.notePaths }),
          slashMenuSource({
            enabled: config.slashMenuEnabled ?? true,
            vimMode: config.vimMode,
          }),
        ],
      }),
    ),
    EditorView.updateListener.of((update) => {
      if (
        update.docChanged &&
        !update.transactions.some((t) => t.annotation(externalDocumentChange))
      ) {
        config.onChangeRef.current?.(update.state.doc.toString());
        config.pluginEditorRef.current?.emitContentChange(
          update.state.doc.toString(),
        );
      }
      if (update.docChanged || update.selectionSet) {
        config.pluginEditorRef.current?.emitChange();
      }
    }),
  ];
}
