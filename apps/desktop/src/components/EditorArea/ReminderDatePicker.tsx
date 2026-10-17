import React, { useState } from "react";
import { Dialog, DialogContent, Button } from "@app/design-system";
import styles from "./ReminderDatePicker.module.scss";

export interface ReminderDatePickerProps {
  open?: boolean;
  initialDate?: string;
  initialTime?: string;
  isEditing?: boolean;
  onConfirm: (result: { date: string; time?: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReminderDatePicker({
  open = true,
  initialDate,
  initialTime,
  isEditing = false,
  onConfirm,
  onDelete,
  onCancel,
}: ReminderDatePickerProps) {
  const now = new Date();
  const defaultDate = initialDate || formatDateString(now);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(initialTime || "09:00");
  const [hasTime, setHasTime] = useState(Boolean(initialTime));
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const setLaterToday = () => {
    setActivePreset("today");
    const d = new Date();
    setDate(formatDateString(d));
    setHasTime(true);
    // 3 hours from now or 18:00
    const curHour = d.getHours();
    const targetHour = Math.min(23, Math.max(18, curHour + 3));
    setTime(`${String(targetHour).padStart(2, "0")}:00`);
  };

  const setTomorrow = () => {
    setActivePreset("tomorrow");
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(formatDateString(d));
    setHasTime(true);
    setTime("09:00");
  };

  const setNextWeek = () => {
    setActivePreset("next-week");
    const d = new Date();
    // Next Monday
    const day = d.getDay();
    const daysUntilNextMon = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilNextMon);
    setDate(formatDateString(d));
    setHasTime(true);
    setTime("09:00");
  };

  const handleConfirm = () => {
    if (!date) return;
    onConfirm({
      date,
      time: hasTime && time ? time : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent showCloseButton={false}>
        <div className={styles["reminder-picker"]}>
          <div className={styles["reminder-picker__presets"]}>
            <button
              type="button"
              className={styles["reminder-picker__preset-btn"]}
              data-active={activePreset === "today"}
              onClick={setLaterToday}
            >
              Later today
            </button>
            <button
              type="button"
              className={styles["reminder-picker__preset-btn"]}
              data-active={activePreset === "tomorrow"}
              onClick={setTomorrow}
            >
              Tomorrow (9 AM)
            </button>
            <button
              type="button"
              className={styles["reminder-picker__preset-btn"]}
              data-active={activePreset === "next-week"}
              onClick={setNextWeek}
            >
              Next week
            </button>
          </div>

          <div className={styles["reminder-picker__fields"]}>
            <div className={styles["reminder-picker__field"]}>
              <label
                htmlFor="reminder-date-input"
                className={styles["reminder-picker__label"]}
              >
                Date
              </label>
              <input
                id="reminder-date-input"
                type="date"
                className={styles["reminder-picker__input"]}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setActivePreset(null);
                }}
              />
            </div>

            <div className={styles["reminder-picker__field"]}>
              <label
                htmlFor="reminder-time-input"
                className={styles["reminder-picker__label"]}
              >
                Time
              </label>
              <input
                id="reminder-time-input"
                type="time"
                className={styles["reminder-picker__input"]}
                value={time}
                disabled={!hasTime}
                onChange={(e) => {
                  setTime(e.target.value);
                  setActivePreset(null);
                }}
              />
            </div>
          </div>

          <label className={styles["reminder-picker__all-day"]}>
            <input
              type="checkbox"
              checked={!hasTime}
              onChange={(e) => setHasTime(!e.target.checked)}
            />
            All day (date only)
          </label>

          <div className={styles["reminder-picker__actions"]}>
            {isEditing && onDelete && (
              <button
                type="button"
                className={styles["reminder-picker__delete-btn"]}
                onClick={onDelete}
              >
                Remove
              </button>
            )}
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              {isEditing ? "Save" : "Insert"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
