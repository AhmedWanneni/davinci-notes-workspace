import { useState, useRef, useEffect, type JSX } from "react";
import { CalendarBlank, Clock, Trash } from "@phosphor-icons/react";
import styles from "./TodoReminderQuickPicker.module.scss";

export interface TodoReminderQuickPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSetReminder: (dateStr: string) => void;
  hasReminder?: boolean;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TodoReminderQuickPicker({
  isOpen,
  onClose,
  onSetReminder,
  hasReminder,
}: TodoReminderQuickPickerProps): JSX.Element | null {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(() => formatDate(new Date()));
  const [customTime, setCustomTime] = useState("09:00");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePreset = (daysFromNow: number, timeStr = "09:00") => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const dateStr = formatDate(target);
    onSetReminder(`${dateStr} ${timeStr}`.trim());
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customDate) {
      const combined = customTime ? `${customDate} ${customTime}` : customDate;
      onSetReminder(combined);
      onClose();
    }
  };

  return (
    <div className={styles["reminder-picker"]} ref={ref} data-testid="todo-reminder-quick-picker">
      <div className={styles["reminder-picker__title"]}>Set Reminder</div>

      <button
        type="button"
        className={styles["reminder-picker__item"]}
        onClick={() => handlePreset(0, "17:00")}
      >
        <Clock size={13} />
        <span>Today (5:00 PM)</span>
      </button>

      <button
        type="button"
        className={styles["reminder-picker__item"]}
        onClick={() => handlePreset(1, "09:00")}
      >
        <Clock size={13} />
        <span>Tomorrow (9:00 AM)</span>
      </button>

      <button
        type="button"
        className={styles["reminder-picker__item"]}
        onClick={() => handlePreset(7, "09:00")}
      >
        <CalendarBlank size={13} />
        <span>Next Week</span>
      </button>

      <div className={styles["reminder-picker__divider"]} />

      {!showCustom ? (
        <button
          type="button"
          className={styles["reminder-picker__item"]}
          onClick={() => setShowCustom(true)}
        >
          <CalendarBlank size={13} />
          <span>Custom Date & Time...</span>
        </button>
      ) : (
        <div className={styles["reminder-picker__custom"]}>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
          />
          <button
            type="button"
            className={styles["reminder-picker__item"]}
            style={{ fontWeight: 600, color: "var(--color-interactive-accent)" }}
            onClick={handleCustomSubmit}
          >
            Save Reminder
          </button>
        </div>
      )}

      {hasReminder && (
        <>
          <div className={styles["reminder-picker__divider"]} />
          <button
            type="button"
            className={`${styles["reminder-picker__item"]} ${styles["is-danger"]}`}
            onClick={() => {
              onSetReminder("");
              onClose();
            }}
          >
            <Trash size={13} />
            <span>Remove reminder</span>
          </button>
        </>
      )}
    </div>
  );
}
