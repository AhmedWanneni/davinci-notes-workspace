import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { autocompletion } from "@codemirror/autocomplete";
import { autocompleteExtension, type ReminderClickInfo } from "./live-preview";
import { linkExtension } from "./links";
import {
  embedAudioExtension,
  embedImageExtension,
  noteEmbedExtension,
} from "./embeds";
import type { PasteAttachmentHandler } from "./clipboard";
import {
  createEditorPluginAdapter,
  type EditorPluginAdapter,
} from "./integration";
import { slashMenuSource, slashMenuAddToOptions } from "./insert/SlashMenu";
import {
  externalChangeAnnotations,
  minimalDocumentChange,
} from "./integration";
import { createEditorExtensions } from "./createEditorExtensions";
import { useVimModeSync } from "./vim/useVimModeSync";

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  onTagClick?: (tagKey: string) => void;
  onReminderClick?: (info: ReminderClickInfo) => void;
  onPasteAttachment?: PasteAttachmentHandler;
  onAttachmentError?: (message: string) => void;
  resolveMediaUrl?: (path: string) => string;
  loadNoteContent?: (path: string) => Promise<string | null>;
  noteContents?: Readonly<Record<string, string>>;
  useVimMode?: boolean;
  onVimModeChange?: (mode: string | null) => void;
  onSaveNoteNow?: (path: string) => Promise<void>;
  onCloseNote?: (path: string) => Promise<void>;
  onCloseAllNotes?: () => Promise<void>;
  onEditorReady?: (editor: EditorPluginAdapter | null) => void;
  onViewReady?: (view: EditorView | null) => void;
  slashMenuEnabled?: boolean;
  vimMode?: string | null;
  strictLineBreaks?: boolean;
}

export function Editor({
  value,
  onChange,
  notePaths,
  sourcePath,
  onLinkClick,
  onExternalLinkClick,
  onTagClick,
  onReminderClick,
  onPasteAttachment,
  onAttachmentError,
  resolveMediaUrl,
  loadNoteContent,
  noteContents,
  useVimMode = false,
  onVimModeChange,
  onSaveNoteNow,
  onCloseNote,
  onCloseAllNotes,
  onEditorReady,
  onViewReady,
  slashMenuEnabled = true,
  vimMode,
  strictLineBreaks = false,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const pluginEditorRef = useRef<EditorPluginAdapter | null>(null);

  const wikilinkCompartmentRef = useRef(new Compartment());
  const autocompleteCompartmentRef = useRef(new Compartment());
  const noteEmbedCompartmentRef = useRef(new Compartment());
  const embedImageCompartmentRef = useRef(new Compartment());
  const embedAudioCompartmentRef = useRef(new Compartment());
  const vimCompartmentRef = useRef(new Compartment());

  const onTagClickRef = useRef(onTagClick ?? (() => {}));
  const onReminderClickRef = useRef(onReminderClick);
  const onPasteAttachmentRef = useRef(onPasteAttachment);
  const onAttachmentErrorRef = useRef(onAttachmentError ?? (() => {}));
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;
  onTagClickRef.current = onTagClick ?? (() => {});
  onReminderClickRef.current = onReminderClick;
  onPasteAttachmentRef.current = onPasteAttachment;
  onAttachmentErrorRef.current = onAttachmentError ?? (() => {});

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = createEditorExtensions({
      notePaths,
      sourcePath,
      onLinkClick,
      onExternalLinkClick,
      onTagClickRef,
      onReminderClickRef,
      onPasteAttachmentRef,
      onAttachmentErrorRef,
      resolveMediaUrl,
      loadNoteContent,
      noteContents,
      slashMenuEnabled,
      vimMode,
      strictLineBreaks,
      wikilinkCompartment: wikilinkCompartmentRef.current,
      autocompleteCompartment: autocompleteCompartmentRef.current,
      noteEmbedCompartment: noteEmbedCompartmentRef.current,
      embedImageCompartment: embedImageCompartmentRef.current,
      embedAudioCompartment: embedAudioCompartmentRef.current,
      vimCompartment: vimCompartmentRef.current,
      onChangeRef,
      pluginEditorRef,
    });

    const startState = EditorState.create({ doc: value, extensions });
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

  useVimModeSync(viewRef, vimCompartmentRef, useVimMode, onVimModeChange, {
    sourcePath,
    handlers: { onSaveNoteNow, onCloseNote, onCloseAllNotes },
  });

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
          autocompletion({
            addToOptions: slashMenuAddToOptions,
            override: [
              autocompleteExtension({ notePaths }),
              slashMenuSource({ enabled: slashMenuEnabled, vimMode }),
            ],
          }),
        ),
        noteEmbedCompartmentRef.current.reconfigure(
          noteEmbedExtension({
            notePaths,
            sourcePath,
            onLinkClick,
            resolveMediaUrl,
            loadNoteContent,
            noteContents,
          }),
        ),
        embedImageCompartmentRef.current.reconfigure(
          embedImageExtension({
            notePaths,
            resolveMediaUrl,
          }),
        ),
        embedAudioCompartmentRef.current.reconfigure(
          embedAudioExtension({
            notePaths,
            resolveMediaUrl,
          }),
        ),
      ],
    });
  }, [
    notePaths,
    sourcePath,
    onLinkClick,
    onExternalLinkClick,
    slashMenuEnabled,
    vimMode,
    resolveMediaUrl,
    loadNoteContent,
    noteContents,
  ]);

  return <div ref={containerRef} className={"editor-container"} />;
}
