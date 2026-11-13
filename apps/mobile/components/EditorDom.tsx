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
import { decodePayload } from "../src/base64Payload";
import { getTextDirection } from "../src/getTextDirection";

export interface EditorDomProps {
  dom?: { useExpoDOMWebView?: boolean; matchContents?: boolean; scrollEnabled?: boolean; [key: string]: unknown };
  initialContent: string;
  notePath?: string;
  editorMode?: "note" | "text";
  onDocChanged?: (notification: DocChangeNotification, payloadBytes: number) => void;
  onMetricsUpdate?: (keystrokeLatencyMs: number) => void;
  actionTrigger?: { id: number; action: ToolbarActionType } | null;
  focusTrigger?: number;
  flushTrigger?: number;
  onFlushAck?: (id: number) => void;
  insertTrigger?: { id: number; text: string } | null;
  themeCss?: string;
}

export default function EditorDom({
  initialContent = "",
  notePath,
  editorMode = "note",
  onDocChanged,
  onFlushAck,
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

  const onDocChangedRef = useRef(onDocChanged);
  onDocChangedRef.current = onDocChanged;
  const onFlushAckRef = useRef(onFlushAck);
  onFlushAckRef.current = onFlushAck;
  const lastActionIdRef = useRef<number | null>(null);
  const lastInsertIdRef = useRef<number | null>(null);

  // Debounced bridge emitter (750ms) - only crosses on debounce or explicit flush
  const bridgeRef = useRef(
    createDebouncedBridge<DocChangeNotification>((notification, size) => {
      onDocChangedRef.current?.(notification, size);
    }, 750),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let lastKeystrokeTime = 0;

    const changeListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        changeCountRef.current += 1;
        const now = performance.now();
        if (lastKeystrokeTime > 0 && typeof onMetricsUpdate === "function") {
          try {
            onMetricsUpdate(now - lastKeystrokeTime);
          } catch {
            /* ignore */
          }
        }
        lastKeystrokeTime = now;

        const docLength = update.state.doc.length;
        const excerpt = update.state.doc.sliceString(0, Math.min(60, docLength));
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

    const docText = decodePayload(initialContent || "");
    const extensions = createMobileEditorExtensions([changeListener], editorMode);
    const direction = getTextDirection(docText);
    containerRef.current.setAttribute("dir", direction);
    if (!document.querySelector("meta[charset]")) {
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "utf-8");
      document.head.prepend(meta);
    }

    const state = EditorState.create({ doc: docText, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    view.dom.dir = direction;
    view.dom.style.direction = direction;
    view.contentDOM.dir = direction;
    view.contentDOM.style.direction = direction;

    viewRef.current = view;
    activePathRef.current = notePath;
    setIsReady(true);

    const detachViewport = attachMobileViewportHandler({
      container: containerRef.current,
      getView: () => viewRef.current,
    });

    const handleContainerTap = (e: Event) => {
      const v = viewRef.current;
      if (v && !v.contentDOM.contains(e.target as Node)) v.focus();
    };
    const hostEl = containerRef.current;
    const evs = ["click", "touchend"] as const;
    evs.forEach((e) => hostEl.addEventListener(e, handleContainerTap));

    const handleFlush = () => bridgeRef.current.flush();
    const handleVisibility = () => { if (document.visibilityState === "hidden") bridgeRef.current.flush(); };
    const handleWindowScroll = () => { if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0); };

    view.contentDOM.addEventListener("blur", handleFlush);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleFlush);
    window.addEventListener("scroll", handleWindowScroll);

    return () => {
      evs.forEach((e) => hostEl.removeEventListener(e, handleContainerTap));
      view.contentDOM.removeEventListener("blur", handleFlush);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleFlush);
      window.removeEventListener("scroll", handleWindowScroll);
      detachViewport();
      bridgeRef.current.flush();
      bridgeRef.current.cancel();
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync document content if initialContent changes externally (e.g. reload from disk)
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    // When the user is typing, the editor view has focus. Never overwrite content or reset cursor while focused!
    if (v.hasFocus) return;

    const currentDoc = v.state.doc.toString();
    const newDoc = decodePayload(initialContent || "");
    if (newDoc !== currentDoc) {
      v.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: newDoc },
      });
    }
  }, [initialContent]);

  // Update path reference on notePath updates without resetting editor state
  useEffect(() => {
    if (activePathRef.current !== notePath) {
      bridgeRef.current.flush();
      activePathRef.current = notePath;
    }
  }, [notePath]);

  // Execute toolbar actions
  useEffect(() => {
    if (viewRef.current && actionTrigger && actionTrigger.id !== lastActionIdRef.current) {
      lastActionIdRef.current = actionTrigger.id;
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
      onFlushAckRef.current?.(flushTrigger);
    }
  }, [flushTrigger]);

  // Insert arbitrary markdown text at cursor (for camera, photo, voice embeds)
  useEffect(() => {
    if (viewRef.current && insertTrigger && insertTrigger.id !== lastInsertIdRef.current) {
      lastInsertIdRef.current = insertTrigger.id;
      const textToInsert = decodePayload(insertTrigger.text);
      const { from, to } = viewRef.current.state.selection.main;
      viewRef.current.dispatch({
        changes: { from, to, insert: textToInsert },
        selection: { anchor: from + textToInsert.length },
        scrollIntoView: true,
      });
    }
  }, [insertTrigger]);

  // Apply reset & theme CSS to DOM container
  useEffect(() => {
    let styleEl = document.getElementById("davinci-mobile-theme") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "davinci-mobile-theme";
      document.head.appendChild(styleEl);
    }
    const vars = `:root{--color-bg-primary:${darkColorTokens.bg.primary};--color-text-normal:${darkColorTokens.text.normal};--color-text-muted:${darkColorTokens.text.muted};--color-text-accent:${darkColorTokens.interactive.accent};--color-bg-active:rgba(255,255,255,0.1);--font-editor:-apple-system,BlinkMacSystemFont,"Geeza Pro","Noto Sans Arabic","Amiri","Traditional Arabic","Segoe UI",Roboto,Helvetica,Arial,sans-serif,system-ui;--font-text:-apple-system,BlinkMacSystemFont,"Geeza Pro","Noto Sans Arabic","Amiri","Traditional Arabic","Segoe UI",Roboto,Helvetica,Arial,sans-serif,system-ui;--editor-font-size:16px;--editor-obsidian-body-line-height:1.7;--editor-content-padding-bottom:300px;--space-6:16px;--space-8:16px;--border-width-thin:1px;}`;
    const reset = `html,body,#root{height:100%!important;min-height:100%!important;margin:0!important;padding:0!important;width:100%!important;overflow:hidden!important;background-color:var(--color-bg-primary,${darkColorTokens.bg.primary})!important;color:var(--color-text-normal,${darkColorTokens.text.normal})!important;}.mobile-editor-dom-host{height:100%!important;min-height:100%!important;width:100%!important;display:flex!important;flex-direction:column!important;}.cm-content,.cm-line{direction:inherit!important;unicode-bidi:plaintext!important;text-align:start!important;}`;
    styleEl.textContent = `${vars}\n${themeCss ?? ""}\n${reset}`;
  }, [themeCss]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="mobile-editor-dom-host"
      style={{ width: "100%", height: "100%", overflow: "hidden", backgroundColor: `var(--color-bg-primary, ${darkColorTokens.bg.primary})` }}
    />
  );
}
