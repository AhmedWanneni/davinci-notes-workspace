import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  Check,
  CaretDown,
  FileText,
  ClockCountdown,
  CalendarPlus,
} from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { optimisticCreateEvent } from "../../calendar/calendarOutboxWorker";
import { flushAndSyncCalendar } from "../../calendar/calendarSyncRunner";
import styles from "./ReminderRowItem.module.scss";

export interface ReminderRowItemProps {
  item: ReminderViewItem;
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onAddAsEvent?: (item: ReminderViewItem) => void;
}

const SNOOZE_PRESETS: Array<{ preset: SnoozePreset; label: string }> = [
  { preset: "10m", label: "10 minutes" },
  { preset: "1h", label: "1 hour" },
  { preset: "tomorrow", label: "Tomorrow morning" },
];

function formatDueLabel(effectiveUtc: string): string {
  const date = new Date(effectiveUtc);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) {
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return `${absMin}m overdue`;
    const hours = Math.round(absMin / 60);
    if (hours < 24) return `${hours}h overdue`;
    const days = Math.round(hours / 24);
    return `${days}d overdue`;
  }

  if (diffMin < 60) return `in ${diffMin}m`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) {
    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `Today, ${timeStr}`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReminderRowItem({
  item,
  onNavigate,
  onToggleDone,
  onSnooze,
  onAddAsEvent,
}: ReminderRowItemProps) {
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
  const [eventAdded, setEventAdded] = useState(false);
  const snoozeRef = useRef<HTMLDivElement>(null);

  const handleAddAsEvent = async () => {
    if (eventAdded) return;
    setEventAdded(true);
    if (onAddAsEvent) {
      onAddAsEvent(item);
      return;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDt = new Date(item.effectiveDueUtc);
    const validStart = isNaN(startDt.getTime()) ? new Date() : startDt;
    const endDt = new Date(validStart.getTime() + 30 * 60_000);
    await optimisticCreateEvent("daily", {
      summary: `🔔 ${item.text}`,
      description: `Reminder from ${item.notePath} (line ${item.line})`,
      start: { dateTime: validStart.toISOString(), timeZone: tz },
      end: { dateTime: endDt.toISOString(), timeZone: tz },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 0 },
          { method: "popup", minutes: 10 },
        ],
      },
    });
    void flushAndSyncCalendar().then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("davinci:calendar-updated"));
      }
    });
  };

  useEffect(() => {
    if (!snoozeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSnoozeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [snoozeMenuOpen]);

  const noteTitle =
    item.notePath.replace(/\.md$/i, "").split("/").pop() ?? item.notePath;
  const dueLabel = formatDueLabel(item.effectiveDueUtc);
  const isOverdue = item.category === "missed";
  const isSnoozed = item.status === "snoozed";

  return (
    <div
      className={`${styles.row} ${isOverdue ? styles["row--overdue"] : ""} ${
        isSnoozed ? styles["row--snoozed"] : ""
      } ${item.done ? styles["row--done"] : ""}`}
      data-category={item.category}
    >
      <div className={styles["row__checkbox-wrap"]}>
        <input
          type="checkbox"
          className={styles.row__checkbox}
          checked={item.done}
          onChange={(e) => onToggleDone(item, e.target.checked)}
          aria-label={`Mark "${item.text}" as done`}
        />
      </div>

      <div className={styles.row__body}>
        <div className={styles.row__title}>
          <span className={styles.row__text} title={item.text}>
            {item.text}
          </span>
        </div>

        <div className={styles.row__meta}>
          <span
            className={`${styles.row__chip} ${
              isOverdue ? styles["row__chip--overdue"] : ""
            } ${isSnoozed ? styles["row__chip--snoozed"] : ""}`}
          >
            {isSnoozed ? (
              <ClockCountdown size={12} />
            ) : (
              <Clock size={12} weight={isOverdue ? "bold" : "regular"} />
            )}
            <span>{isSnoozed ? `Snoozed (${dueLabel})` : dueLabel}</span>
          </span>

          <button
            type="button"
            className={styles["row__note-link"]}
            onClick={() => onNavigate(item.notePath, item.line)}
            title={`Open ${item.notePath} at line ${item.line}`}
          >
            <FileText size={12} />
            <span>{noteTitle}</span>
            <span className={styles.row__line}>:L{item.line}</span>
          </button>
        </div>
      </div>

      <div className={styles.row__actions}>
        <button
          type="button"
          className={styles.row__btn}
          onClick={() => void handleAddAsEvent()}
          disabled={eventAdded}
          title="Add as calendar event"
          data-testid={`reminder-add-as-event-${item.reminderKey}`}
        >
          <CalendarPlus size={13} weight="bold" />
          <span>{eventAdded ? "Added" : "Add as Event"}</span>
        </button>

        <button
          type="button"
          className={`${styles.row__btn} ${styles["row__btn--done"]}`}
          onClick={() => onToggleDone(item, true)}
          title="Mark complete"
        >
          <Check size={13} weight="bold" />
          <span>Done</span>
        </button>

        <div className={styles.row__snooze} ref={snoozeRef}>
          <button
            type="button"
            className={`${styles.row__btn} ${
              snoozeMenuOpen ? styles["row__btn--active"] : ""
            }`}
            onClick={() => setSnoozeMenuOpen((v) => !v)}
            title="Snooze reminder"
            aria-expanded={snoozeMenuOpen}
          >
            <span>Snooze</span>
            <CaretDown size={11} weight="bold" />
          </button>

          {snoozeMenuOpen && (
            <div className={styles["row__snooze-menu"]} role="menu">
              {SNOOZE_PRESETS.map(({ preset, label }) => (
                <button
                  key={preset}
                  type="button"
                  role="menuitem"
                  className={styles["row__snooze-item"]}
                  onClick={() => {
                    setSnoozeMenuOpen(false);
                    onSnooze(item, preset);
                  }}
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
}
