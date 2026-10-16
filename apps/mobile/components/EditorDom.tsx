"use dom";

import React, { useEffect, useRef, useState } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  undo,
  redo,
  indentMore,
  indentLess,
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  listExtension,
  listIndentKeymap,
  livePreviewExtension,
  softLineBreakExtension,
  tagExtension,
  tagTheme,
} from "@app/editor";
import {
  createDebouncedBridge,
  type DocChangeNotification,
  type ToolbarActionType,
} from "../src/bridgeProtocol";
import { attachMobileViewportHandler } from "../src/viewportHandler";
import { requestEditorFocus } from "../src/iosFocusWorkaround";

export interface EditorDomProps {
  initialContent: string;
  onDocChanged?: (notification: DocChangeNotification, payloadBytes: number) => void;
  onMetricsUpdate?: (keystrokeLatencyMs: number) => void;
  actionTrigger?: { id: number; action: ToolbarActionType } | null;
  focusTrigger?: number;
}

export default function EditorDom({
  initialContent,
  onDocChanged,
  onMetricsUpdate,
  actionTrigger,
  focusTrigger,
}: EditorDomProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const changeCountRef = useRef<number>(0);
  const [_isReady, setIsReady] = useState(false);

  // Debounced bridge emitter (300ms) - only metadata crosses bridge
  const bridgeRef = useRef(
    createDebouncedBridge<DocChangeNotification>((notification, size) => {
      onDocChanged?.(notification, size);
    }, 300),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let lastKeystrokeTime = 0;

    const changeListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        changeCountRef.current += 1;
        const now = performance.now();
        if (lastKeystrokeTime > 0) {
          const latency = now - lastKeystrokeTime;
          onMetricsUpdate?.(latency);
        }
        lastKeystrokeTime = now;

        const docLength = update.state.doc.length;
        const excerpt = update.state.doc.sliceString(0, Math.min(60, docLength));

        bridgeRef.current.emit({
          docLength,
          changeCount: changeCountRef.current,
          excerpt,
          timestamp: Date.now(),
        });
      }
    });

    const extensions: Extension[] = [
      history(),
      drawSelection(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      keymap.of([
        ...historyKeymap,
        ...listIndentKeymap,
        ...defaultKeymap,
      ]),
      syntaxHighlighting(editorHighlightStyle),
      editorTheme,
      tagTheme,
      softLineBreakExtension,
      markdown({
        extensions: [Strikethrough, highlightExtension],
      }),
      livePreviewExtension,
      listExtension(),
      tagExtension(),
      changeListener,
    ];

    const state = EditorState.create({
      doc: initialContent,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    const detachViewport = attachMobileViewportHandler({
      container: containerRef.current,
      getView: () => viewRef.current,
    });

    // Background Save Guard: flush pending changes before webview is paused
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        bridgeRef.current.flush();
      }
    };
    const handlePageHide = () => {
      bridgeRef.current.flush();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      detachViewport();
      bridgeRef.current.cancel();
      view.destroy();
      viewRef.current = null;
    };
  }, [initialContent]);

  // Execute toolbar actions dispatched from native toolbar
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !actionTrigger) return;

    const { action } = actionTrigger;
    const { from, to } = view.state.selection.main;

    switch (action) {
      case "wikilink": {
        const text = view.state.sliceDoc(from, to);
        const insert = `[[${text}]]`;
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + (text ? insert.length : 2) },
          scrollIntoView: true,
        });
        break;
      }
      case "link": {
        const text = view.state.sliceDoc(from, to) || "text";
        const insert = `[${text}](url)`;
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length - 4, head: from + insert.length - 1 },
          scrollIntoView: true,
        });
        break;
      }
      case "tag": {
        view.dispatch({
          changes: { from, to, insert: "#" },
          selection: { anchor: from + 1 },
          scrollIntoView: true,
        });
        break;
      }
      case "checkbox": {
        const line = view.state.doc.lineAt(from);
        const insert = "- [ ] ";
        view.dispatch({
          changes: { from: line.from, to: line.from, insert },
          selection: { anchor: from + insert.length },
          scrollIntoView: true,
        });
        break;
      }
      case "indent": {
        indentMore(view);
        break;
      }
      case "outdent": {
        indentLess(view);
        break;
      }
      case "undo": {
        undo(view);
        break;
      }
      case "redo": {
        redo(view);
        break;
      }
    }
  }, [actionTrigger]);

  // Handle programmatic focus requests (iOS focus workaround)
  useEffect(() => {
    if (!viewRef.current || !focusTrigger) return;
    requestEditorFocus(viewRef.current, { position: "end" });
  }, [focusTrigger]);

  return (
    <div
      ref={containerRef}
      className="mobile-editor-dom-host"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-primary, #ffffff)",
      }}
    />
  );
}
