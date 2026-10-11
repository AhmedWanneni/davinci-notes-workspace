import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { autocompletion } from "@codemirror/autocomplete";
import { syntaxHighlighting } from "@codemirror/language";
import { editorHighlightStyle, editorTheme } from "./editorTheme";
import { highlightExtension } from "./highlightExtension";
import { livePreviewExtension } from "./livePreviewExtension";
import { linkExtension } from "./linkExtension";
import { imageExtension } from "./imageExtension";
import { embedImageExtension } from "./embedImageExtension";
import { listExtension, listIndentKeymap } from "./listExtension";
import { autocompleteExtension } from "./autocompleteExtension";
import { codeBlockLanguage } from "./codeBlockExtension";
import { markdownAnnotationsExtension } from "./markdownAnnotationsExtension";
import { markdownAnnotationTheme } from "./markdownAnnotationTheme";
import { tableExtension } from "./tableExtension";
import { tableTheme } from "./tableTheme";
import { codeBlockLayoutTheme } from "./codeBlockLayoutTheme";
import { mermaidExtension } from "./mermaidExtension";
import { mermaidTheme } from "./mermaidTheme";
import { mathExtension } from "./mathExtension";
import { mathTheme } from "./mathTheme";
import { tagExtension } from "./tagExtension";
import { tagTheme } from "./tagTheme";
import { htmlBlockExtension } from "./htmlBlockExtension";
import { htmlBlockTheme } from "./htmlBlockTheme";
import { htmlInlineExtension } from "./htmlInlineExtension";
import { htmlInlineTheme } from "./htmlInlineTheme";
import {
  insertHardLineBreak,
  softLineBreakExtension,
} from "./lineBreakExtension";
import {
  attachVimModeListener,
  loadVimExtension,
  registerVimExCommands,
} from "./vimExtension";
import {
  attachmentDropHandler,
  attachmentPasteHandler,
  type PasteAttachmentHandler,
} from "./pasteAttachment";
import {
  createEditorPluginAdapter,
  type EditorPluginAdapter,
} from "./pluginEditorAdapter";
import {
  externalChangeAnnotations,
  externalDocumentChange,
  minimalDocumentChange,
} from "./externalDocumentChange";

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  onTagClick?: (tagKey: string) => void;
  onPasteAttachment?: PasteAttachmentHandler;
  onAttachmentError?: (message: string) => void;
  resolveMediaUrl?: (path: string) => string;
  useVimMode?: boolean;
  onVimModeChange?: (mode: string | null) => void;
  onSaveNoteNow?: (path: string) => Promise<void>;
  onCloseNote?: (path: string) => Promise<void>;
  onCloseAllNotes?: () => Promise<void>;
  onEditorReady?: (editor: EditorPluginAdapter | null) => void;
  onViewReady?: (view: EditorView | null) => void;
}

export function Editor({
  value,
  onChange,
  notePaths,
  sourcePath,
  onLinkClick,
  onExternalLinkClick,
  onTagClick,
  onPasteAttachment,
  onAttachmentError,
  resolveMediaUrl,
  useVimMode = false,
  onVimModeChange,
  onSaveNoteNow,
  onCloseNote,
  onCloseAllNotes,
  onEditorReady,
  onViewReady,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const pluginEditorRef = useRef<EditorPluginAdapter | null>(null);

  // Compartments for reactive updates of options
  const wikilinkCompartmentRef = useRef(new Compartment());
  const autocompleteCompartmentRef = useRef(new Compartment());
  const vimCompartmentRef = useRef(new Compartment());
  const onTagClickRef = useRef(onTagClick ?? (() => {}));
  const onPasteAttachmentRef = useRef(onPasteAttachment);
  const onAttachmentErrorRef = useRef(onAttachmentError ?? (() => {}));

  // Track latest onChange to avoid re-binding CodeMirror listener
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  onTagClickRef.current = onTagClick ?? (() => {});
  onPasteAttachmentRef.current = onPasteAttachment;
  onAttachmentErrorRef.current = onAttachmentError ?? (() => {});

  // Initialize CodeMirror EditorView
  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        editorTheme,
        markdownAnnotationTheme,
        tableTheme,
        codeBlockLayoutTheme,
        mermaidTheme,
        mathTheme,
        tagTheme,
        htmlBlockTheme,
        htmlInlineTheme,
        EditorView.lineWrapping,
        ...(onPasteAttachment
          ? [
              attachmentPasteHandler(
                (file, position) =>
                  onPasteAttachmentRef.current!(file, position),
                (message) => onAttachmentErrorRef.current(message),
              ),
            ]
          : []),
        ...(onPasteAttachment
          ? [
              attachmentDropHandler(
                (file, position) =>
                  onPasteAttachmentRef.current!(file, position),
                (message) => onAttachmentErrorRef.current(message),
              ),
            ]
          : []),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([
          { key: "Shift-Enter", run: insertHardLineBreak },
          ...defaultKeymap,
          ...historyKeymap,
          ...listIndentKeymap,
        ]),
        markdown({
          extensions: [Strikethrough, highlightExtension],
          codeLanguages: codeBlockLanguage,
        }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        markdownAnnotationsExtension(),
        softLineBreakExtension,
        listExtension(),
        tableExtension(),
        mermaidExtension({ onLinkClick }),
        mathExtension(),
        imageExtension(),
        embedImageExtension({ notePaths, resolveMediaUrl }),
        tagExtension({ onTagClick: (tagKey) => onTagClickRef.current(tagKey) }),
        htmlBlockExtension(),
        htmlInlineExtension(),
        // Dynamic compartments for options
        wikilinkCompartmentRef.current.of(
          linkExtension({
            notePaths,
            sourcePath,
            onLinkClick,
            onExternalLinkClick,
          }),
        ),
        autocompleteCompartmentRef.current.of(
          autocompletion({ override: [autocompleteExtension({ notePaths })] }),
        ),
        vimCompartmentRef.current.of([]),
        // Document changes updater
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((transaction) =>
              transaction.annotation(externalDocumentChange),
            )
          ) {
            onChangeRef.current(update.state.doc.toString());
            pluginEditorRef.current?.emitContentChange(
              update.state.doc.toString(),
            );
          }
          if (update.docChanged || update.selectionSet)
            pluginEditorRef.current?.emitChange();
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    onViewReady?.(view);
    pluginEditorRef.current = createEditorPluginAdapter(view);
    onEditorReady?.(pluginEditorRef.current);

    return () => {
      pluginEditorRef.current?.destroy();
      pluginEditorRef.current = null;
      onEditorReady?.(null);
      onViewReady?.(null);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Synchronize incoming value changes (prevent loop / cursor jump)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: minimalDocumentChange(currentValue, value),
        annotations: externalChangeAnnotations,
      });
    }
  }, [value]);

  const onVimModeChangeRef = useRef(onVimModeChange);
  onVimModeChangeRef.current = onVimModeChange;

  const exHandlersRef = useRef({
    sourcePath,
    handlers: { onSaveNoteNow, onCloseNote, onCloseAllNotes },
  });
  exHandlersRef.current = {
    sourcePath,
    handlers: { onSaveNoteNow, onCloseNote, onCloseAllNotes },
  };

  // Synchronize dynamic Vim keybinding extension when enabled/disabled
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    let cancelled = false;
    let cleanupListener: (() => void) | undefined;

    if (useVimMode) {
      registerVimExCommands(() => exHandlersRef.current);
      void loadVimExtension().then((extension) => {
        if (!cancelled && viewRef.current === view) {
          view.dispatch({
            effects: vimCompartmentRef.current.reconfigure(extension),
            selection: view.state.selection,
          });
          view.requestMeasure();
          if (onVimModeChangeRef.current) {
            cleanupListener = attachVimModeListener(view, (mode) => {
              onVimModeChangeRef.current?.(mode);
            });
          }
        }
      });
    } else {
      view.dispatch({
        effects: vimCompartmentRef.current.reconfigure([]),
        selection: view.state.selection,
      });
      view.requestMeasure();
      onVimModeChangeRef.current?.(null);
    }

    return () => {
      cancelled = true;
      cleanupListener?.();
      onVimModeChangeRef.current?.(null);
    };
  }, [useVimMode]);

  // Synchronize compartment configs when paths or parameters change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        wikilinkCompartmentRef.current.reconfigure(
          linkExtension({
            notePaths,
            sourcePath,
            onLinkClick,
            onExternalLinkClick,
          }),
        ),
        autocompleteCompartmentRef.current.reconfigure(
          autocompletion({ override: [autocompleteExtension({ notePaths })] }),
        ),
      ],
    });
  }, [notePaths, sourcePath, onLinkClick, onExternalLinkClick]);

  return <div ref={containerRef} className={"editor-container"} />;
}
