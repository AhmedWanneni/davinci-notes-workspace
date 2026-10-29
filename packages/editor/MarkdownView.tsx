import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough, Table } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import {
  editorHighlightStyle,
  readOnlyEditorTheme,
  readOnlyMarkdownAnnotationTheme,
  reminderTheme,
  tagTheme,
} from "./theme";
import {
  highlightExtension,
  listExtension,
  livePreviewExtension,
  markdownAnnotationsExtension,
  reminderExtension,
  type ReminderClickInfo,
  softLineBreakExtension,
  tagExtension,
} from "./live-preview";
import { codeBlockLanguage, codeBlockLayoutTheme } from "./blocks/code";
import { readOnlyTableTheme, tableExtension } from "./blocks/table";
import { linkExtension } from "./links";
import {
  embedAudioExtension,
  embedAudioTheme,
  embedImageExtension,
  imageExtension,
  noteEmbedExtension,
  noteEmbedTheme,
} from "./embeds";
import { mermaidExtension, mermaidTheme } from "./blocks/mermaid";
import { mathExtension, mathTheme } from "./blocks/math";
import {
  htmlBlockExtension,
  htmlBlockTheme,
  htmlInlineExtension,
  htmlInlineTheme,
} from "./blocks/html";

export interface MarkdownViewProps {
  value: string;
  notePaths?: readonly string[];
  sourcePath?: string;
  onLinkClick?: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  onTagClick?: (tagKey: string) => void;
  onReminderClick?: (info: ReminderClickInfo) => void;
  className?: string;
  resolveMediaUrl?: (path: string) => string;
  loadNoteContent?: (path: string) => Promise<string | null>;
  noteContents?: Readonly<Record<string, string>>;
}

/**
 * Lightweight, read-only live-preview markdown renderer reusing
 * CodeMirror 6 syntax highlighting, link handling, and image rendering.
 */
export function MarkdownView({
  value,
  notePaths = [],
  sourcePath = "",
  onLinkClick = () => {},
  onExternalLinkClick,
  onTagClick = () => {},
  onReminderClick,
  className = "",
  resolveMediaUrl,
  loadNoteContent,
  noteContents,
}: MarkdownViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wikilinkCompartmentRef = useRef(new Compartment());
  const onTagClickRef = useRef(onTagClick);
  onTagClickRef.current = onTagClick;
  const onReminderClickRef = useRef(onReminderClick);
  onReminderClickRef.current = onReminderClick;

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        readOnlyEditorTheme,
        readOnlyMarkdownAnnotationTheme,
        readOnlyTableTheme,
        codeBlockLayoutTheme,
        mermaidTheme,
        mathTheme,
        tagTheme,
        htmlBlockTheme,
        htmlInlineTheme,
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        markdown({
          extensions: [Table, Strikethrough, highlightExtension],
          codeLanguages: codeBlockLanguage,
        }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        markdownAnnotationsExtension({ isReadOnly: true }),
        softLineBreakExtension,
        listExtension({ isReadOnly: true }),
        tableExtension({ isReadOnly: true }),
        mermaidExtension({ isReadOnly: true, onLinkClick }),
        mathExtension({ isReadOnly: true }),
        imageExtension({ isReadOnly: true }),
        embedImageExtension({ notePaths, isReadOnly: true, resolveMediaUrl }),
        embedAudioTheme,
        embedAudioExtension({
          notePaths,
          sourcePath,
          isReadOnly: true,
          resolveMediaUrl,
        }),
        noteEmbedTheme,
        noteEmbedExtension({
          notePaths,
          sourcePath,
          onLinkClick,
          resolveMediaUrl,
          isReadOnly: true,
          loadNoteContent,
          noteContents,
        }),
        tagExtension({ onTagClick: (tagKey) => onTagClickRef.current(tagKey) }),
        reminderTheme,
        reminderExtension({
          onReminderClick: (info) => onReminderClickRef.current?.(info),
        }),
        htmlBlockExtension(),
        htmlInlineExtension(),
        wikilinkCompartmentRef.current.of(
          linkExtension({
            notePaths,
            sourcePath,
            onLinkClick,
            onExternalLinkClick,
          }),
        ),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Synchronize document updates
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  // Synchronize wikilink options
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
      ],
    });
  }, [notePaths, sourcePath, onLinkClick, onExternalLinkClick]);

  return (
    <div
      ref={containerRef}
      className={`markdown-view ${className}`.trim()}
      data-testid="markdown-view"
    />
  );
}
