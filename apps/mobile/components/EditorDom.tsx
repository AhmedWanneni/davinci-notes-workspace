"use dom";

import React, { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createDebouncedBridge,
  type DocChangeNotification,
  type ToolbarActionType,
} from "../src/bridgeProtocol";
import { attachMobileViewportHandler } from "../src/viewportHandler";
import { requestEditorFocus } from "../src/iosFocusWorkaround";
import { createMobileEditorExtensions } from "./editorExtensions";
import { executeToolbarAction } from "./editorToolbarActions";
import { darkColorTokens } from "@app/design-tokens/mobile";

export interface EditorDomProps {
  dom?: {
    useExpoDOMWebView?: boolean;
    matchContents?: boolean;
    scrollEnabled?: boolean;
    [key: string]: unknown;
  };
  initialContent: string;
  notePath?: string;
  onDocChanged?: (
    notification: DocChangeNotification,
    payloadBytes: number,
  ) => void;
  onMetricsUpdate?: (keystrokeLatencyMs: number) => void;
  actionTrigger?: { id: number; action: ToolbarActionType } | null;
  focusTrigger?: number;
  flushTrigger?: number;
  insertTrigger?: { id: number; text: string } | null;
  themeCss?: string;
}

export default function EditorDom({
  initialContent,
  notePath,
  onDocChanged,
  onMetricsUpdate,
  actionTrigger,
  focusTrigger,
  flushTrigger,
  insertTrigger,
  themeCss,
}: EditorDomProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const changeCountRef = useRef<number>(0);
  const activePathRef = useRef<string | undefined>(notePath);
  const [_isReady, setIsReady] = useState(false);

  // Debounced bridge emitter (750ms) - only crosses on debounce or explicit flush
  const bridgeRef = useRef(
    createDebouncedBridge<DocChangeNotification>((notification, size) => {
      onDocChanged?.(notification, size);
    }, 750),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let lastKeystrokeTime = 0;

    const changeListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        changeCountRef.current += 1;
        const now = performance.now();
        if (lastKeystrokeTime > 0) {
          onMetricsUpdate?.(now - lastKeystrokeTime);
        }
        lastKeystrokeTime = now;

        const docLength = update.state.doc.length;
        const excerpt = update.state.doc.sliceString(
          0,
          Math.min(60, docLength),
        );
        const fullContent = update.state.doc.toString();

        bridgeRef.current.emit({
          docLength,
          changeCount: changeCountRef.current,
          excerpt,
          timestamp: Date.now(),
          content: fullContent,
        });
      }
    });

    const extensions = createMobileEditorExtensions([changeListener]);
    const state = EditorState.create({ doc: initialContent, extensions });
    const view = new EditorView({ state, parent: containerRef.current });

    viewRef.current = view;
    activePathRef.current = notePath;
    setIsReady(true);

    const detachViewport = attachMobileViewportHandler({
      container: containerRef.current,
      getView: () => viewRef.current,
    });

    // Save Guard: Flush on blur, visibilitychange (app background), and pagehide
    const handleBlur = () => bridgeRef.current.flush();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") bridgeRef.current.flush();
    };
    const handlePageHide = () => bridgeRef.current.flush();

    view.contentDOM.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      view.contentDOM.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      detachViewport();
      bridgeRef.current.flush(); // Flush any pending edit before unmounting
      bridgeRef.current.cancel();
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Reuse editor instance when notePath or initialContent updates
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (activePathRef.current !== notePath) {
      bridgeRef.current.flush();
      activePathRef.current = notePath;
      const extensions = createMobileEditorExtensions([]);
      view.setState(EditorState.create({ doc: initialContent, extensions }));
    }
  }, [notePath, initialContent]);

  // Execute toolbar actions
  useEffect(() => {
    if (viewRef.current && actionTrigger) {
      executeToolbarAction(viewRef.current, actionTrigger.action);
    }
  }, [actionTrigger]);

  // Execute programmatic focus requests (iOS focus workaround)
  useEffect(() => {
    if (viewRef.current && focusTrigger) {
      requestEditorFocus(viewRef.current, { position: "end" });
    }
  }, [focusTrigger]);

  // Execute programmatic flush requests from native container
  useEffect(() => {
    if (flushTrigger) {
      bridgeRef.current.flush();
    }
  }, [flushTrigger]);

  // Insert arbitrary markdown text at cursor (for camera, photo, voice embeds)
  useEffect(() => {
    if (viewRef.current && insertTrigger) {
      const { from, to } = viewRef.current.state.selection.main;
      viewRef.current.dispatch({
        changes: { from, to, insert: insertTrigger.text },
        selection: { anchor: from + insertTrigger.text.length },
        scrollIntoView: true,
      });
    }
  }, [insertTrigger]);

  // Apply sanitized theme CSS to DOM container
  useEffect(() => {
    let styleEl = document.getElementById(
      "davinci-mobile-theme",
    ) as HTMLStyleElement | null;
    if (!themeCss) {
      styleEl?.remove();
      return;
    }
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "davinci-mobile-theme";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = themeCss;
  }, [themeCss]);

  return (
    <div
      ref={containerRef}
      className="mobile-editor-dom-host"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: `var(--color-bg-primary, ${darkColorTokens.bg.primary})`,
      }}
    />
  );
}
