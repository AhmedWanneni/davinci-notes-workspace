import React, { useState, useRef, useEffect } from "react";
import {
  Clock, CaretDown, FileText, PencilSimple,
  Trash, WhatsappLogo, WarningCircle,
} from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { openWhatsAppClickToChat } from "../../notifications/adapters/whatsappClickAdapter";
import styles from "./ReminderRow.module.scss";

export interface ReminderRowProps {
  item: ReminderViewItem;
  isSelected?: boolean;
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onEdit: (item: ReminderViewItem) => void;
  onDelete: (item: ReminderViewItem) => void;
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
    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Today, ${timeStr}`;
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReminderRow({
  item,
  isSelected = false,
  onNavigate,
  onToggleDone,
  onSnooze,
  onEdit,
  onDelete,
}: ReminderRowProps) {
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
  const snoozeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snoozeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [snoozeMenuOpen]);

  const noteTitle = item.notePath.replace(/\.md$/i, "").split("/").pop() ?? item.notePath;
  const dueLabel = formatDueLabel(item.effectiveDueUtc);
  const isOverdue = item.category === "missed";
  const isSnoozed = item.status === "snoozed";
  const hasWhatsApp = item.channels?.includes("whatsapp") || item.channels?.includes("whatsapp-click");

  const handleWhatsAppClick = async () => {
    try {
      await openWhatsAppClickToChat("", item.text);
    } catch (err) {
      console.warn("Failed to open WhatsApp click-to-chat:", err);
    }
  };

  return (
    <div
      className={`${styles["reminder-row"]} ${isOverdue ? styles["reminder-row--overdue"] : ""} ${
        isSnoozed ? styles["reminder-row--snoozed"] : ""
      } ${item.done ? styles["reminder-row--done"] : ""} ${
        isSelected ? styles["reminder-row--selected"] : ""
      }`}
      data-testid="reminder-row"
    >
      <div className={styles["reminder-row__checkbox-wrap"]}>
        <input
          type="checkbox"
          className={styles["reminder-row__checkbox"]}
          checked={item.done}
          onChange={(e) => onToggleDone(item, e.target.checked)}
          aria-label={`Mark "${item.text}" as ${item.done ? "open" : "done"}`}
        />
      </div>

      <div className={styles["reminder-row__body"]}>
        <div className={styles["reminder-row__title-row"]}>
          <span className={styles["reminder-row__text"]}>{item.text}</span>
          {item.deliveryError && (
            <span
              className={styles["reminder-row__error-badge"]}
              title={`Delivery failure: ${item.deliveryError}`}
            >
              <WarningCircle size={14} weight="fill" />
              <span>Failed</span>
            </span>
          )}
        </div>

        <div className={styles["reminder-row__meta"]}>
          <button
            type="button"
            className={styles["reminder-row__note-link"]}
            onClick={() => onNavigate(item.notePath, item.line)}
            title={`Open ${item.notePath}:${item.line}`}
          >
            <FileText size={13} />
            <span>
              {noteTitle}:{item.line}
            </span>
          </button>

          <span
            className={`${styles["reminder-row__chip"]} ${
              isOverdue ? styles["reminder-row__chip--overdue"] : ""
            } ${isSnoozed ? styles["reminder-row__chip--snoozed"] : ""}`}
          >
            <Clock size={12} />
            <span>{isSnoozed ? `Snoozed (${dueLabel})` : dueLabel}</span>
          </span>

          {item.channels && item.channels.length > 0 && (
            <div className={styles["reminder-row__channels"]}>
              {item.channels.map((ch) => (
                <span key={ch} className={styles["reminder-row__channel-badge"]}>
                  {ch}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles["reminder-row__actions"]}>
        {hasWhatsApp && (
          <button
            type="button"
            className={styles["reminder-row__action-btn"]}
            onClick={handleWhatsAppClick}
            title="Send on WhatsApp"
            aria-label="Send on WhatsApp"
          >
            <WhatsappLogo size={15} />
          </button>
        )}

        {!item.done && (
          <div className={styles["reminder-row__snooze-wrapper"]} ref={snoozeRef}>
            <button
              type="button"
              className={styles["reminder-row__action-btn"]}
              onClick={() => setSnoozeMenuOpen(!snoozeMenuOpen)}
              title="Snooze reminder"
              aria-label="Snooze"
            >
              <CaretDown size={14} />
            </button>
            {snoozeMenuOpen && (
              <div className={styles["reminder-row__snooze-menu"]}>
                {SNOOZE_PRESETS.map((p) => (
                  <button
                    key={p.preset}
                    type="button"
                    className={styles["reminder-row__snooze-item"]}
                    onClick={() => {
                      onSnooze(item, p.preset);
                      setSnoozeMenuOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className={styles["reminder-row__action-btn"]}
          onClick={() => onEdit(item)}
          title="Edit reminder"
          aria-label="Edit"
        >
          <PencilSimple size={15} />
        </button>

        <button
          type="button"
          className={`${styles["reminder-row__action-btn"]} ${styles["reminder-row__action-btn--delete"]}`}
          onClick={() => onDelete(item)}
          title="Delete reminder"
          aria-label="Delete"
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
}
