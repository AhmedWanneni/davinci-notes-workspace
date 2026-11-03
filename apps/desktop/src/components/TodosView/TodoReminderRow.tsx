import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type JSX } from "react";
import {
  CaretDown,
  Check,
  Clock,
  FileText,
  PencilSimple,
  Trash,
  WhatsappLogo,
} from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { openWhatsAppClickToChat } from "../../notifications/adapters/whatsappClickAdapter";
import styles from "./TodoReminderRow.module.scss";

export interface TodoReminderRowProps {
  item: ReminderViewItem;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onUpdateText: (item: ReminderViewItem, text: string) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onEdit: (item: ReminderViewItem) => void;
  onDelete: (item: ReminderViewItem) => void;
  onOpenNote?: (path: string, line?: number) => void;
}

const SNOOZE_PRESETS: Array<{ preset: SnoozePreset; label: string }> = [
  { preset: "10m", label: "10 minutes" },
  { preset: "1h", label: "1 hour" },
  { preset: "tomorrow", label: "Tomorrow morning" },
];

function formatDueLabel(effectiveUtc: string): string {
  const date = new Date(effectiveUtc);
  const diffMin = Math.round((date.getTime() - Date.now()) / 60000);

  if (diffMin < 0) {
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return `${absMin}m overdue`;
    const hours = Math.round(absMin / 60);
    if (hours < 24) return `${hours}h overdue`;
    return `${Math.round(hours / 24)}d overdue`;
  }
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 1440) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TodoReminderRow({
  item,
  onToggleDone,
  onUpdateText,
  onSnooze,
  onEdit,
  onDelete,
  onOpenNote,
}: TodoReminderRowProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(item.text);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const snoozeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snoozeOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [snoozeOpen]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (draftText.trim() && draftText !== item.text) {
      onUpdateText(item, draftText.trim());
    }
  }, [draftText, item, onUpdateText]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") {
      setDraftText(item.text);
      setIsEditing(false);
    }
  }, [commitEdit, item.text]);

  const isOverdue = item.category === "missed" && !item.done;
  const isSnoozed = item.status === "snoozed";
  const dueLabel = formatDueLabel(item.effectiveDueUtc);
  const noteTitle = item.notePath.replace(/\.md$/i, "").split("/").pop() ?? item.notePath;
  const hasWhatsApp = item.channels?.some((c) => c.includes("whatsapp"));

  return (
    <div
      className={`${styles["todo-reminder-row"]} ${item.done ? styles["is-completed"] : ""} ${isOverdue ? styles["is-overdue"] : ""}`}
      data-testid={`todo-reminder-row-${item.reminderKey}`}
    >
      <div className={styles["todo-reminder-row__left"]}>
        <button
          type="button"
          className={`${styles["todo-reminder-row__checkbox"]} ${item.done ? styles["is-checked"] : ""}`}
          onClick={() => onToggleDone(item, !item.done)}
          aria-label={item.done ? "Mark incomplete" : "Mark complete"}
        >
          {item.done && <Check size={12} weight="bold" />}
        </button>

        <div className={styles["todo-reminder-row__content"]}>
          {isEditing ? (
            <input
              type="text"
              className={styles["todo-reminder-row__edit-input"]}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <span
              className={styles["todo-reminder-row__text"]}
              onDoubleClick={() => setIsEditing(true)}
            >
              {item.text}
            </span>
          )}

          <span
            className={`${styles["todo-reminder-row__badge"]} ${isOverdue ? styles["is-overdue"] : ""} ${isSnoozed ? styles["is-snoozed"] : ""}`}
            title="Due time"
          >
            <Clock size={11} />
            <span>{isSnoozed ? `Snoozed (${dueLabel})` : dueLabel}</span>
          </span>

          <button
            type="button"
            className={styles["todo-reminder-row__link-badge"]}
            onClick={() => onOpenNote?.(item.notePath, item.line)}
            title={`Open note ${item.notePath}:${item.line}`}
          >
            <FileText size={11} />
            <span>{noteTitle}</span>
          </button>

          {item.channels?.map((ch) => (
            <span key={ch} className={styles["todo-reminder-row__channel-badge"]}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className={styles["todo-reminder-row__actions"]}>
        {hasWhatsApp && (
          <button
            type="button"
            className={styles["todo-reminder-row__btn"]}
            onClick={() => void openWhatsAppClickToChat("", item.text)}
            title="Send on WhatsApp"
            aria-label="Send on WhatsApp"
          >
            <WhatsappLogo size={14} />
          </button>
        )}

        {!item.done && (
          <div className={styles["todo-reminder-row__snooze-wrap"]} ref={snoozeRef}>
            <button
              type="button"
              className={styles["todo-reminder-row__btn"]}
              onClick={() => setSnoozeOpen((v) => !v)}
              title="Snooze reminder"
              aria-label="Snooze"
            >
              <CaretDown size={13} />
            </button>
            {snoozeOpen && (
              <div className={styles["todo-reminder-row__snooze-menu"]}>
                {SNOOZE_PRESETS.map((p) => (
                  <button
                    key={p.preset}
                    type="button"
                    className={styles["todo-reminder-row__snooze-item"]}
                    onClick={() => {
                      onSnooze(item, p.preset);
                      setSnoozeOpen(false);
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
          className={styles["todo-reminder-row__btn"]}
          onClick={() => onEdit(item)}
          title="Edit reminder"
          aria-label="Edit"
        >
          <PencilSimple size={14} />
        </button>

        <button
          type="button"
          className={`${styles["todo-reminder-row__btn"]} ${styles["is-danger"]}`}
          onClick={() => onDelete(item)}
          title="Delete reminder"
          aria-label="Delete"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}
