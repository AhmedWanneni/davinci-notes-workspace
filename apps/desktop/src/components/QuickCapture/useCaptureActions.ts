import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { QuickCaptureMode } from "./QuickCaptureHeader";

export interface UseCaptureActionsOptions {
  onSave?: (
    text: string,
    filename?: string,
    folder?: string,
  ) => Promise<void> | void;
  onDismiss?: () => Promise<void> | void;
  onQuit?: () => Promise<void> | void;
  onOpenNote?: (path: string) => Promise<void> | void;
  filename: string;
  folder: string;
  setText: (t: string) => void;
  setFilename: (f: string) => void;
  setFolder: (f: string) => void;
  setMode: (m: QuickCaptureMode) => void;
  setAutoStartRecord: (a: boolean) => void;
  resetSearch: () => void;
}

const toErrorText = (err: unknown, fallback: string) =>
  typeof err === "string" ? err : err instanceof Error ? err.message : fallback;

export function useCaptureActions({
  onSave,
  onDismiss,
  onQuit,
  onOpenNote,
  filename,
  folder,
  setText,
  setFilename,
  setFolder,
  setMode,
  setAutoStartRecord,
  resetSearch,
}: UseCaptureActionsOptions) {
  const [savedDestination, setSavedDestination] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDismiss = async () => {
    setErrorMessage(null);
    setSavedDestination(null);
    setAutoStartRecord(false);
    resetSearch();
    setMode("capture");
    if (onDismiss) await onDismiss();
    else void invoke("quick_capture_dismiss").catch(() => {});
  };

  const handleQuit = async () => {
    setErrorMessage(null);
    setSavedDestination(null);
    setAutoStartRecord(false);
    resetSearch();
    setMode("capture");
    if (onQuit) {
      await onQuit();
    } else {
      try {
        await invoke("quick_capture_quit_app");
      } catch {
        void invoke("request_app_exit").catch(() => {});
      }
    }
  };

  const handleSave = async (
    content: string,
    overrideFilename?: string,
    overrideFolder?: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      await handleDismiss();
      return;
    }
    const clearInputs = () => {
      setText("");
      setFilename("");
      setFolder("");
    };
    setErrorMessage(null);
    try {
      const fName = (overrideFilename ?? filename).trim() || undefined;
      const fDir = (overrideFolder ?? folder).trim() || undefined;
      if (onSave) {
        if (fName || fDir) await onSave(content, fName, fDir);
        else await onSave(content);
        clearInputs();
      } else {
        const res = await invoke<{ path: string; isAppend: boolean }>(
          "quick_capture_save",
          {
            text: content,
            filename: fName ?? null,
            folder: fDir ?? null,
          },
        );
        setSavedDestination(res.path);
        setTimeout(() => {
          clearInputs();
          setSavedDestination(null);
          void invoke("quick_capture_dismiss").catch(() => {});
        }, 650);
      }
    } catch (err) {
      setErrorMessage(toErrorText(err, "Failed to save"));
    }
  };

  const handleOpenNote = async (path: string) => {
    setErrorMessage(null);
    try {
      if (onOpenNote) await onOpenNote(path);
      else await invoke("open_note_from_capture", { path });
      resetSearch();
      setMode("capture");
    } catch (err) {
      setErrorMessage(toErrorText(err, "Failed to open note"));
    }
  };

  return {
    savedDestination,
    errorMessage,
    setErrorMessage,
    handleDismiss,
    handleQuit,
    handleSave,
    handleOpenNote,
  };
}
