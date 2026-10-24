import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isWebPlatformMode } from "@app/platform-adapters";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { getRecentNotes, type TrayRecentNote } from "./recentNotes";

export const TRAY_NEW_NOTE_EVENT = "davinci-tray-new-note";
export const TRAY_DAILY_NOTE_EVENT = "davinci-tray-daily-note";
export const TRAY_OPEN_NOTE_EVENT = "davinci-tray-open-note";
export const TRAY_OPEN_VAULT_EVENT = "davinci-tray-open-vault";
export const TRAY_QUIT_EVENT = "davinci-tray-quit";
export const CLEAN_QUIT_EVENT = "davinci-clean-quit";
export const WINDOW_HIDDEN_EVENT = "davinci-window-hidden";

interface TrayMenuActions {
  vaultPath: string | null;
  createNewNote: () => Promise<string | null>;
  onDailyNotes?: () => void;
  onOpenVault?: () => void;
}

/** Listen for tray actions and window lifecycle events; syncs debounced recent notes to tray menu. */
export function useTrayMenuActions({
  vaultPath,
  createNewNote,
  onDailyNotes,
  onOpenVault,
}: TrayMenuActions) {
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync recent notes to native tray on store updates
  useEffect(() => {
    if (isWebPlatformMode()) return;
    const syncToTray = () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = setTimeout(() => {
        const { noteHistory, openNotes, activeNotePath, allNotePaths } =
          useWorkspaceStore.getState();
        const recentNotes: TrayRecentNote[] = vaultPath
          ? getRecentNotes(
              noteHistory.paths,
              openNotes,
              activeNotePath,
              allNotePaths,
              5,
            )
          : [];
        void invoke("update_tray_recent_notes", {
          recentNotes,
          hasVault: Boolean(vaultPath),
        }).catch((err) => {
          console.error("Failed to update tray recent notes", err);
        });
      }, 200);
    };

    const syncRemindersToTray = async () => {
      if (!vaultPath) return;
      try {
        const { getVaultIndexDb } = await import("../vault/sqliteIndex");
        const { queryUpcomingReminders } =
          await import("../vault/sqliteReminderIndex");
        const db = await getVaultIndexDb();
        const upcoming = await queryUpcomingReminders(db, 3);
        const upcomingReminders = upcoming.map((r) => {
          const date = new Date(r.due_at_utc);
          const dueTime = date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });
          return {
            notePath: r.note_path,
            line: r.line,
            text: r.text,
            dueTime,
          };
        });
        void invoke("update_tray_reminders", {
          upcomingReminders,
          hasVault: true,
        }).catch(() => {});
      } catch {
        // ignore outside tauri
      }
    };

    syncToTray();
    void syncRemindersToTray();

    const unsub = useWorkspaceStore.subscribe((state, prevState) => {
      if (
        state.noteHistory !== prevState.noteHistory ||
        state.openNotes !== prevState.openNotes ||
        state.activeNotePath !== prevState.activeNotePath ||
        state.allNotePaths !== prevState.allNotePaths
      ) {
        syncToTray();
      }
      if (state.vaultUpdateCounter !== prevState.vaultUpdateCounter) {
        void syncRemindersToTray();
      }
    });

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      unsub();
    };
  }, [vaultPath]);

  // Listen for native tray events
  useEffect(() => {
    if (isWebPlatformMode()) return;
    let disposed = false;
    let unlistenNewNote: (() => void) | undefined;
    let unlistenDailyNote: (() => void) | undefined;
    let unlistenOpenNote: (() => void) | undefined;
    let unlistenOpenVault: (() => void) | undefined;
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

      unlistenDailyNote = await listen(TRAY_DAILY_NOTE_EVENT, () => {
        if (!vaultPath) return;
        onDailyNotes?.();
      });

      unlistenOpenNote = await listen<{ path: string }>(
        TRAY_OPEN_NOTE_EVENT,
        (event) => {
          const notePath = event.payload?.path;
          if (notePath) {
            void useWorkspaceStore.getState().openNote(notePath);
          }
        },
      );

      unlistenOpenVault = await listen(TRAY_OPEN_VAULT_EVENT, () => {
        onOpenVault?.();
      });

      unlistenQuit = await listen(TRAY_QUIT_EVENT, flushAndExit);
      unlistenCleanQuit = await listen(CLEAN_QUIT_EVENT, flushAndExit);
      unlistenWindowHidden = await listen(WINDOW_HIDDEN_EVENT, flushOnHidden);

      if (disposed) {
        unlistenNewNote();
        unlistenDailyNote();
        unlistenOpenNote();
        unlistenOpenVault();
        unlistenQuit();
        unlistenCleanQuit();
        unlistenWindowHidden();
      }
    };

    void register();

    return () => {
      disposed = true;
      unlistenNewNote?.();
      unlistenDailyNote?.();
      unlistenOpenNote?.();
      unlistenOpenVault?.();
      unlistenQuit?.();
      unlistenCleanQuit?.();
      unlistenWindowHidden?.();
    };
  }, [vaultPath, createNewNote, onDailyNotes, onOpenVault]);
}
