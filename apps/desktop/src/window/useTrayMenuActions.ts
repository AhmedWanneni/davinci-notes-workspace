import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useWorkspaceStore } from "../state/useWorkspaceStore";

export const TRAY_NEW_NOTE_EVENT = "davinci-tray-new-note";
export const TRAY_QUIT_EVENT = "davinci-tray-quit";

interface TrayMenuActions {
  vaultPath: string | null;
  createNewNote: () => Promise<string | null>;
}

/** Listen for static tray-menu actions; creation and quit stay on existing JS paths. */
export function useTrayMenuActions({
  vaultPath,
  createNewNote,
}: TrayMenuActions) {
  useEffect(() => {
    let disposed = false;
    let unlistenNewNote: (() => void) | undefined;
    let unlistenQuit: (() => void) | undefined;

    const register = async () => {
      unlistenNewNote = await listen(TRAY_NEW_NOTE_EVENT, () => {
        if (!vaultPath) return;
        void createNewNote();
      });
      unlistenQuit = await listen(TRAY_QUIT_EVENT, () => {
        void useWorkspaceStore
          .getState()
          .saveAllDirty()
          .catch((error) => {
            console.error("Failed to flush notes before quit", error);
          })
          .finally(() => {
            void invoke("request_app_exit");
          });
      });
      if (disposed) {
        unlistenNewNote();
        unlistenQuit();
      }
    };

    void register();

    return () => {
      disposed = true;
      unlistenNewNote?.();
      unlistenQuit?.();
    };
  }, [vaultPath, createNewNote]);
}
