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

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
  onTagClick?: (tagKey: string) => void;
}

export function Editor({
  value,
  onChange,
  notePaths,
  sourcePath,
  onLinkClick,
  onExternalLinkClick,
  onTagClick,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Compartments for reactive updates of options
  const wikilinkCompartmentRef = useRef(new Compartment());
  const autocompleteCompartmentRef = useRef(new Compartment());
  const onTagClickRef = useRef(onTagClick ?? (() => {}));

  // Track latest onChange to avoid re-binding CodeMirror listener
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  onTagClickRef.current = onTagClick ?? (() => {});

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
