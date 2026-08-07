import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { autocompletion } from "@codemirror/autocomplete";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import { livePreviewExtension } from "./livePreviewExtension";
import { wikilinkExtension } from "./wikilinkExtension";
import { autocompleteExtension } from "./autocompleteExtension";

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
}

// Define highlight styling using design system CSS variables
const editorHighlightStyle = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: "var(--type-scale-2xl)",
    fontWeight: "var(--type-weight-bold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading2,
    fontSize: "var(--type-scale-xl)",
    fontWeight: "var(--type-weight-bold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading3,
    fontSize: "var(--type-scale-lg)",
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-normal)",
  },
  {
    tag: t.heading4,
    fontSize: "var(--type-scale-base)",
    fontWeight: "var(--type-weight-semibold)",
    color: "var(--color-text-normal)",
  },
  { tag: t.strong, fontWeight: "var(--type-weight-bold)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.monospace, fontFamily: "var(--font-editor)" },
  { tag: t.keyword, color: "var(--color-text-accent)" },
  {
    tag: t.link,
    color: "var(--color-text-accent)",
    textDecoration: "underline",
  },
]);

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-text-normal)",
    fontFamily: "var(--font-editor)",
    fontSize: "var(--type-scale-base)",
    lineHeight: "var(--type-leading-relaxed)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
  },
  ".cm-content": {
    padding: "var(--space-6) var(--space-8)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-text-accent)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--color-bg-active) !important",
    },
  ".cm-activeLine": {
    backgroundColor: "var(--color-bg-primary-alt)",
  },
  // Style wikilinks
  ".cm-wikilink": {
    color: "var(--color-text-accent)",
    textDecoration: "none",
    cursor: "pointer",
  },
  ".cm-wikilink:hover": {
    textDecoration: "underline",
  },
  ".cm-wikilink-unresolved": {
    textDecoration: "none",
    borderBottom: "1px dashed var(--color-text-accent)",
  },
  // Live-preview delimiters hiding (hidden by default, shown on active line)
  ".cm-markdown-syntax": {
    display: "none !important",
  },
  ".cm-activeLine .cm-markdown-syntax": {
    display: "inline !important",
    opacity: 0.5,
  },
});

export function Editor({
  value,
  onChange,
  notePaths,
  sourcePath,
  onLinkClick,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Compartments for reactive updates of options
  const wikilinkCompartmentRef = useRef(new Compartment());
  const autocompleteCompartmentRef = useRef(new Compartment());

  // Track latest onChange to avoid re-binding CodeMirror listener
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize CodeMirror EditorView
  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        editorTheme,
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        markdown(),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        // Dynamic compartments for options
        wikilinkCompartmentRef.current.of(
          wikilinkExtension({ notePaths, sourcePath, onLinkClick }),
        ),
        autocompleteCompartmentRef.current.of(
          autocompletion({ override: [autocompleteExtension({ notePaths })] }),
        ),
        // Document changes updater
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
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

  // Synchronize incoming value changes (prevent loop / cursor jump)
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

  // Synchronize compartment configs when paths or parameters change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        wikilinkCompartmentRef.current.reconfigure(
          wikilinkExtension({ notePaths, sourcePath, onLinkClick }),
        ),
        autocompleteCompartmentRef.current.reconfigure(
          autocompletion({ override: [autocompleteExtension({ notePaths })] }),
        ),
      ],
    });
  }, [notePaths, sourcePath, onLinkClick]);

  return <div ref={containerRef} className={"editor-container"} />;
}
