import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { editorHighlightStyle, readOnlyEditorTheme } from "./editorTheme";
import { highlightExtension } from "./highlightExtension";
import { livePreviewExtension } from "./livePreviewExtension";
import { linkExtension } from "./linkExtension";
import { imageExtension } from "./imageExtension";
import { listExtension } from "./listExtension";
import { softLineBreakExtension } from "./lineBreakExtension";

export interface MarkdownViewProps {
  value: string;
  notePaths?: readonly string[];
  sourcePath?: string;
  onLinkClick?: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  className?: string;
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
  className = "",
}: MarkdownViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wikilinkCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        readOnlyEditorTheme,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        softLineBreakExtension,
        listExtension({ isReadOnly: true }),
        imageExtension({ isReadOnly: true }),
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
