import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { CodeMirror, getCM, Vim } from "@replit/codemirror-vim";
import type { CodeMirrorV } from "@replit/codemirror-vim";

let vimLoaderPromise: Promise<Extension> | null = null;

/**
 * Dynamically loads @replit/codemirror-vim extension chunk.
 * Guarantees zero byte footprint on initial editor load when Vim mode is disabled.
 */
export async function loadVimExtension(): Promise<Extension> {
  vimLoaderPromise ??= import("@replit/codemirror-vim").then((module) =>
    module.vim(),
  );
  return vimLoaderPromise;
}

export function formatVimMode(evt: {
  mode?: string;
  subMode?: string;
}): string {
  if (evt.mode === "insert") return "INSERT";
  if (evt.mode === "replace") return "REPLACE";
  if (evt.mode === "visual") {
    if (evt.subMode === "linewise") return "VISUAL LINE";
    if (evt.subMode === "blockwise") return "VISUAL BLOCK";
    return "VISUAL";
  }
  return "NORMAL";
}

/**
 * Subscribes to vim-mode-change events on a CodeMirror 6 EditorView instance.
 * Returns an unsubscribe function to prevent listener leaks.
 */
export function attachVimModeListener(
  view: EditorView,
  onModeChange: (mode: string | null) => void,
): (() => void) | undefined {
  const cm = getCM(view);
  if (!cm) return undefined;

  const handler = (evt: { mode?: string; subMode?: string }) => {
    onModeChange(formatVimMode(evt));
  };

  CodeMirror.on(cm, "vim-mode-change", handler);

  // Emit initial state
  const currentMode = cm.state?.vim?.visualMode
    ? {
        mode: "visual",
        subMode: cm.state.vim.visualLine
          ? "linewise"
          : cm.state.vim.visualBlock
            ? "blockwise"
            : "",
      }
    : cm.state?.vim?.insertMode
      ? { mode: "insert" }
      : { mode: "normal" };

  onModeChange(formatVimMode(currentMode));

  return () => {
    CodeMirror.off(cm, "vim-mode-change", handler);
  };
}

export interface VimExHandlers {
  onSaveNoteNow?: (path: string) => Promise<void>;
  onCloseNote?: (path: string) => Promise<void>;
  onCloseAllNotes?: () => Promise<void>;
}

let activeHandlersGetter:
  (() => { sourcePath: string; handlers: VimExHandlers }) | null = null;
let exCommandsRegistered = false;

/**
 * Registers Vim Ex commands (:w, :q, :wq, :x, :qa, :wqa) onto @replit/codemirror-vim.
 * Handlers are dynamically evaluated per invocation.
 */
export function registerVimExCommands(
  getHandlers: () => {
    sourcePath: string;
    handlers: VimExHandlers;
  },
) {
  activeHandlersGetter = getHandlers;
  if (exCommandsRegistered) return;
  exCommandsRegistered = true;

  const showMsg = (cm: CodeMirrorV, msg: string) => {
    if (
      typeof cm?.openNotification === "function" &&
      typeof document !== "undefined"
    ) {
      const span = document.createElement("span");
      span.textContent = msg;
      cm.openNotification(span, { bottom: true, duration: 3000 });
    }
  };

  Vim.defineEx("write", "w", (cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { sourcePath, handlers } = activeHandlersGetter();
    if (sourcePath && handlers.onSaveNoteNow) {
      void handlers.onSaveNoteNow(sourcePath).then(() => {
        const title = sourcePath.split("/").pop() ?? sourcePath;
        showMsg(cm, `"${title}" written`);
      });
    }
  });

  Vim.defineEx("quit", "q", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { sourcePath, handlers } = activeHandlersGetter();
    if (sourcePath && handlers.onCloseNote) {
      void handlers.onCloseNote(sourcePath);
    }
  });

  Vim.defineEx("wq", "wq", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { sourcePath, handlers } = activeHandlersGetter();
    if (sourcePath && handlers.onSaveNoteNow && handlers.onCloseNote) {
      void handlers.onSaveNoteNow(sourcePath).then(() => {
        void handlers.onCloseNote?.(sourcePath);
      });
    }
  });

  Vim.defineEx("x", "x", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { sourcePath, handlers } = activeHandlersGetter();
    if (sourcePath && handlers.onSaveNoteNow && handlers.onCloseNote) {
      void handlers.onSaveNoteNow(sourcePath).then(() => {
        void handlers.onCloseNote?.(sourcePath);
      });
    }
  });

  Vim.defineEx("qall", "qa", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { handlers } = activeHandlersGetter();
    if (handlers.onCloseAllNotes) {
      void handlers.onCloseAllNotes();
    }
  });

  Vim.defineEx("wqall", "wqa", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { handlers } = activeHandlersGetter();
    if (handlers.onCloseAllNotes) {
      void handlers.onCloseAllNotes();
    }
  });

  Vim.defineEx("wall", "wa", (_cm: CodeMirrorV) => {
    if (!activeHandlersGetter) return;
    const { handlers } = activeHandlersGetter();
    if (handlers.onCloseAllNotes) {
      void handlers.onCloseAllNotes();
    }
  });
}
