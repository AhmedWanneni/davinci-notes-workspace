import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useWorkspaceStore } from "../state/useWorkspaceStore";

export const TRAY_NEW_NOTE_EVENT = "davinci-tray-new-note";
export const TRAY_QUIT_EVENT = "davinci-tray-quit";
export const CLEAN_QUIT_EVENT = "davinci-clean-quit";
export const WINDOW_HIDDEN_EVENT = "davinci-window-hidden";

interface TrayMenuActions {
  vaultPath: string | null;
  createNewNote: () => Promise<string | null>;
}

/** Listen for tray actions and window lifecycle events; clean quit flushes dirty notes. */
export function useTrayMenuActions({
  vaultPath,
  createNewNote,
}: TrayMenuActions) {
  useEffect(() => {
    let disposed = false;
    let unlistenNewNote: (() => void) | undefined;
    let unlistenQuit: (() => void) | undefined;
    let unlistenCleanQuit: (() => void) | undefined;
    let unlistenWindowHidden: (() => void) | undefined;

    const flushAndExit = () => {
      void useWorkspaceStore
        .getState()
        .saveAllDirty()
        .catch((error) => {
          console.error("Failed to flush notes before quit", error);
        })
        .finally(() => {
          void invoke("request_app_exit");
        });
    };

    const flushOnHidden = () => {
      void useWorkspaceStore
        .getState()
        .saveAllDirty()
        .catch((error) => {
          console.error("Failed to flush notes on window hide", error);
        });
    };

    const register = async () => {
      unlistenNewNote = await listen(TRAY_NEW_NOTE_EVENT, () => {
        if (!vaultPath) return;
        void createNewNote();
      });
      unlistenQuit = await listen(TRAY_QUIT_EVENT, flushAndExit);
      unlistenCleanQuit = await listen(CLEAN_QUIT_EVENT, flushAndExit);
      unlistenWindowHidden = await listen(WINDOW_HIDDEN_EVENT, flushOnHidden);

      if (disposed) {
        unlistenNewNote();
        unlistenQuit();
        unlistenCleanQuit();
        unlistenWindowHidden();
      }
    };

    void register();

    return () => {
      disposed = true;
      unlistenNewNote?.();
      unlistenQuit?.();
      unlistenCleanQuit?.();
      unlistenWindowHidden?.();
    };
  }, [vaultPath, createNewNote]);
}
