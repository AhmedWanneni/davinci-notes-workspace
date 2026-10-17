import React, { useEffect, useState, useCallback } from "react";
import { Bell, Check, X, Clock, CaretDown } from "@phosphor-icons/react";
import { markReminderDoneInVault } from "../../vault/reminderTaskActions";
import {
  computeSnoozeTime,
  snoozeReminderAction,
  type SnoozePreset,
} from "../../vault/reminderSnoozeActions";
import styles from "./ReminderNotificationToast.module.scss";

export interface ActiveToastReminder {
  id: number;
  reminderKey?: string;
  notePath: string;
  line: number;
  dueAtUtc: string;
  text: string;
}

export interface ReminderNotificationToastProps {
  onSelectNote: (notePath: string, line?: number) => void;
}

export function ReminderNotificationToast({
  onSelectNote,
}: ReminderNotificationToastProps) {
  const [activeReminders, setActiveReminders] = useState<ActiveToastReminder[]>(
    [],
  );
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);

  useEffect(() => {
    let unlistenDue: (() => void) | undefined;
    let unlistenMissed: (() => void) | undefined;

    void (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlistenDue = await listen<ActiveToastReminder[]>(
          "davinci-reminders-due",
          (event) => {
            if (Array.isArray(event.payload) && event.payload.length > 0) {
              setActiveReminders((prev) => [...prev, ...event.payload]);
            }
          },
        );
        unlistenMissed = await listen<ActiveToastReminder[]>(
          "davinci-reminders-missed",
          (event) => {
            if (Array.isArray(event.payload) && event.payload.length > 0) {
              setActiveReminders((prev) => [...prev, ...event.payload]);
            }
          },
        );
      } catch {
        // Outside Tauri runtime (e.g. tests)
      }
    })();

    return () => {
      unlistenDue?.();
      unlistenMissed?.();
    };
  }, []);

  const current = activeReminders[0] as ActiveToastReminder | undefined;

  const handleDismiss = useCallback(() => {
    setActiveReminders((prev) => prev.slice(1));
    setSnoozeMenuOpen(false);
  }, []);

  const handleDone = useCallback(async () => {
    if (!current) return;
    await markReminderDoneInVault(
      current.notePath,
      { line: current.line, text: current.text, dueAtUtc: current.dueAtUtc },
      true,
    );
    handleDismiss();
  }, [current, handleDismiss]);

  const handleSnooze = useCallback(
    async (preset: SnoozePreset) => {
      if (!current) return;
      const targetTime = computeSnoozeTime(preset);
      await snoozeReminderAction(
        {
          reminderKey: current.reminderKey,
          notePath: current.notePath,
          dueAtUtc: current.dueAtUtc,
          text: current.text,
        },
        targetTime,
      );
      handleDismiss();
    },
    [current, handleDismiss],
  );

  const handleOpen = useCallback(() => {
    if (!current) return;
    onSelectNote(current.notePath, current.line);
    handleDismiss();
  }, [current, onSelectNote, handleDismiss]);

  if (!current) {
    return null;
  }

  const remaining = activeReminders.length - 1;

  return (
    <div className={styles.toast} role="alert" aria-live="assertive">
      <div className={styles.toast__header}>
        <div className={styles.toast__titleGroup}>
          <Bell size={16} className={styles.toast__icon} />
          <span className={styles.toast__heading}>Reminder</span>
          {remaining > 0 && (
            <span className={styles.toast__badge}>+{remaining} more</span>
          )}
        </div>
        <button
          type="button"
          className={styles.toast__close}
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      <div className={styles.toast__body}>
        <p className={styles.toast__text}>{current.text}</p>
        <button
          type="button"
          className={styles.toast__note}
          onClick={handleOpen}
        >
          {current.notePath}
          <span className={styles.toast__line}>:L{current.line}</span>
        </button>
      </div>

      <div className={styles.toast__actions}>
        <button
          type="button"
          className={styles["toast__btn--done"]}
          onClick={handleDone}
        >
          <Check size={14} />
          <span>Done</span>
        </button>

        <div className={styles.toast__snoozeWrap}>
          <button
            type="button"
            className={styles["toast__btn--snooze"]}
            onClick={() => setSnoozeMenuOpen((v) => !v)}
          >
            <Clock size={14} />
            <span>Snooze</span>
            <CaretDown size={12} />
          </button>

          {snoozeMenuOpen && (
            <div className={styles.toast__menu}>
              <button
                type="button"
                className={styles.toast__menuItem}
                onClick={() => handleSnooze("10m")}
              >
                10 minutes
              </button>
              <button
                type="button"
                className={styles.toast__menuItem}
                onClick={() => handleSnooze("1h")}
              >
                1 hour
              </button>
              <button
                type="button"
                className={styles.toast__menuItem}
                onClick={() => handleSnooze("tomorrow")}
              >
                Tomorrow morning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
