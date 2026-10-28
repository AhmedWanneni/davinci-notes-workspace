import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  X,
  Clock,
  CaretDown,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { markReminderDoneInVault } from "../../vault/reminderTaskActions";
import {
  computeSnoozeTime,
  snoozeReminderAction,
  type SnoozePreset,
} from "../../vault/reminderSnoozeActions";
import { openWhatsAppClickUrl } from "../../notifications/adapters/whatsappClickAdapter";
import {
  normalizeReminder,
  mergeUniqueReminders,
  type ActiveToastReminder,
  type RawReminderPayload,
} from "./normalizeToastReminder";
import styles from "./ReminderNotificationToast.module.scss";

export type { ActiveToastReminder };

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

    const handleCustomWhatsApp = (e: Event) => {
      const detail = (e as CustomEvent<RawReminderPayload>).detail;
      if (!detail) return;
      const normalized = normalizeReminder(detail);
      setActiveReminders((prev) => {
        const idx = prev.findIndex(
          (r) =>
            (r.reminderKey && r.reminderKey === normalized.reminderKey) ||
            (r.notePath === normalized.notePath && r.text === normalized.text),
        );
        if (idx >= 0) {
          return prev.map((r, i) =>
            i === idx
              ? { ...r, whatsappClickUrl: normalized.whatsappClickUrl }
              : r,
          );
        }
        return mergeUniqueReminders(prev, [normalized]);
      });
    };

    window.addEventListener(
      "davinci:whatsapp-manual-toast",
      handleCustomWhatsApp,
    );

    void (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const onEvent = (event: { payload: RawReminderPayload[] }) => {
          if (Array.isArray(event.payload) && event.payload.length > 0) {
            const incoming = event.payload.map(normalizeReminder);
            setActiveReminders((prev) => mergeUniqueReminders(prev, incoming));
          }
        };
        unlistenDue = await listen<RawReminderPayload[]>(
          "davinci-reminders-due",
          onEvent,
        );
        unlistenMissed = await listen<RawReminderPayload[]>(
          "davinci-reminders-missed",
          onEvent,
        );
      } catch {
        // Outside Tauri runtime
      }
    })();

    return () => {
      window.removeEventListener(
        "davinci:whatsapp-manual-toast",
        handleCustomWhatsApp,
      );
      unlistenDue?.();
      unlistenMissed?.();
    };
  }, []);

  const current = activeReminders[0] as ActiveToastReminder | undefined;

  const handleDismiss = useCallback(() => {
    setActiveReminders((prev) => (prev.length > 0 ? prev.slice(1) : []));
    setSnoozeMenuOpen(false);
  }, []);

  const handleDone = useCallback(async () => {
    if (!current) return;
    try {
      if (current.notePath) {
        await markReminderDoneInVault(
          current.notePath,
          { line: current.line, text: current.text, dueAtUtc: current.dueAtUtc },
          true,
        );
      }
    } catch (err) {
      console.error("Failed to mark reminder done:", err);
    } finally {
      handleDismiss();
    }
  }, [current, handleDismiss]);

  const handleSnooze = useCallback(
    async (preset: SnoozePreset) => {
      if (!current) return;
      try {
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
      } catch (err) {
        console.error("Failed to snooze reminder:", err);
      } finally {
        handleDismiss();
      }
    },
    [current, handleDismiss],
  );

  const handleOpen = useCallback(() => {
    if (!current) return;
    if (current.notePath) {
      onSelectNote(current.notePath, current.line);
    }
    handleDismiss();
  }, [current, onSelectNote, handleDismiss]);

  if (!current) return null;

  const remaining = activeReminders.length - 1;

  const toastContent = (
    <div
      className={styles.toast}
      role="alert"
      aria-live="assertive"
      data-reminder-toast="true"
    >
      <div className={styles.toast__header}>
        <div className={styles["toast__title-group"]}>
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
          onClick={() => void handleDone()}
        >
          <Check size={14} />
          <span>Done</span>
        </button>

        {current.whatsappClickUrl && (
          <button
            type="button"
            className={styles["toast__btn--snooze"]}
            title="Opens WhatsApp with your message prefilled — press Send in WhatsApp to complete"
            onClick={() => {
              if (current.whatsappClickUrl) {
                void openWhatsAppClickUrl(current.whatsappClickUrl);
              }
            }}
          >
            <WhatsappLogo size={14} />
            <span>Send on WhatsApp</span>
          </button>
        )}

        <div className={styles["toast__snooze-wrap"]}>
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
              {(
                [
                  ["10m", "10 minutes"],
                  ["1h", "1 hour"],
                  ["tomorrow", "Tomorrow morning"],
                ] as const
              ).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  className={styles["toast__menu-item"]}
                  onClick={() => void handleSnooze(preset)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(toastContent, document.body);
  }
  return toastContent;
}
