import { useEffect, useRef, type RefObject } from "react";
import type { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
  attachVimModeListener,
  loadVimExtension,
  registerVimExCommands,
} from "./vimExtension";

export interface VimExHandlersState {
  sourcePath: string;
  handlers: {
    onSaveNoteNow?: (path: string) => Promise<void>;
    onCloseNote?: (path: string) => Promise<void>;
    onCloseAllNotes?: () => Promise<void>;
  };
}

export function useVimModeSync(
  viewRef: RefObject<EditorView | null>,
  vimCompartmentRef: RefObject<Compartment>,
  useVimMode: boolean,
  onVimModeChange?: (mode: string | null) => void,
  exHandlersState?: VimExHandlersState,
) {
  const onVimModeChangeRef = useRef(onVimModeChange);
  onVimModeChangeRef.current = onVimModeChange;

  const exHandlersRef = useRef(exHandlersState);
  exHandlersRef.current = exHandlersState;

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    let cancelled = false;
    let cleanupListener: (() => void) | undefined;

    if (useVimMode) {
      registerVimExCommands(() => exHandlersRef.current!);
      void loadVimExtension().then((extension) => {
        if (!cancelled && viewRef.current === view) {
          view.dispatch({
            effects: vimCompartmentRef.current?.reconfigure(extension),
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
        effects: vimCompartmentRef.current?.reconfigure([]),
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
  }, [useVimMode, viewRef, vimCompartmentRef]);
}
