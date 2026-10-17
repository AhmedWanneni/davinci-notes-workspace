import React, { useState } from "react";
import { Clock, Check, CaretDown } from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import styles from "./ReminderRowItem.module.scss";

export interface ReminderRowItemProps {
  item: ReminderViewItem;
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
}

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
}: ReminderRowItemProps) {
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
  const noteTitle =
    item.notePath.replace(/\.md$/i, "").split("/").pop() ?? item.notePath;
  const dueLabel = formatDueLabel(item.effectiveDueUtc);
  const isOverdue = item.category === "missed";
  const isSnoozed = item.status === "snoozed";

  return (
    <div
      className={`${styles.row} ${isOverdue ? styles["row--overdue"] : ""}`}
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
          <span className={styles.row__text}>{item.text}</span>
          <button
            type="button"
            className={styles["row__note-link"]}
            onClick={() => onNavigate(item.notePath, item.line)}
            title={`Open ${item.notePath} at line ${item.line}`}
          >
            {noteTitle}
            <span className={styles.row__line}>:L{item.line}</span>
          </button>
        </div>

        <div className={styles.row__meta}>
          <span
            className={`${styles.row__chip} ${
              isOverdue ? styles["row__chip--overdue"] : ""
            }`}
          >
            <Clock size={12} />
            <span>{dueLabel}</span>
          </span>
          {isSnoozed && (
            <span className={styles["row__chip--snoozed"]}>Snoozed</span>
          )}
        </div>
      </div>

      <div className={styles.row__actions}>
        <button
          type="button"
          className={styles.row__btn}
          onClick={() => onToggleDone(item, true)}
          title="Mark complete"
        >
          <Check size={14} />
          <span>Done</span>
        </button>

        <div className={styles.row__snooze}>
          <button
            type="button"
            className={styles.row__btn}
            onClick={() => setSnoozeMenuOpen((v) => !v)}
            title="Snooze reminder"
          >
            <span>Snooze</span>
            <CaretDown size={12} />
          </button>

          {snoozeMenuOpen && (
            <div className={styles["row__snooze-menu"]}>
              <button
                type="button"
                className={styles["row__snooze-item"]}
                onClick={() => {
                  setSnoozeMenuOpen(false);
                  onSnooze(item, "10m");
                }}
              >
                10 minutes
              </button>
              <button
                type="button"
                className={styles["row__snooze-item"]}
                onClick={() => {
                  setSnoozeMenuOpen(false);
                  onSnooze(item, "1h");
                }}
              >
                1 hour
              </button>
              <button
                type="button"
                className={styles["row__snooze-item"]}
                onClick={() => {
                  setSnoozeMenuOpen(false);
                  onSnooze(item, "tomorrow");
                }}
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
