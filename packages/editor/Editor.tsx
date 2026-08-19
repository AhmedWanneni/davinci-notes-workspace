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
import { syntaxHighlighting } from "@codemirror/language";
import { editorHighlightStyle, editorTheme } from "./editorTheme";
import { livePreviewExtension } from "./livePreviewExtension";
import { wikilinkExtension } from "./wikilinkExtension";
import { autocompleteExtension } from "./autocompleteExtension";
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
}

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
        keymap.of([
          { key: "Shift-Enter", run: insertHardLineBreak },
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        markdown(),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        softLineBreakExtension,
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
