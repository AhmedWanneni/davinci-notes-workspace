import React, { useState, useEffect } from "react";
import { X, CalendarBlank, Clock, Repeat, FileText } from "@phosphor-icons/react";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import { ChannelPickerField } from "./ChannelPickerField";
import styles from "./RemindersView.module.scss";
import modalStyles from "./RemindersModal.module.scss";

export interface ReminderFormData {
  notePath: string;
  text: string;
  date: string;
  time?: string;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly" | "";
  channels: DeliveryChannel[];
}

export interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReminderFormData) => Promise<void>;
  initialData?: ReminderFormData | null;
  availableNotes: readonly string[];
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReminderFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableNotes,
}: ReminderFormModalProps) {
  const [notePath, setNotePath] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState<ReminderFormData["recurrence"]>("");
  const [channels, setChannels] = useState<DeliveryChannel[]>(["desktop"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setNotePath(initialData.notePath);
      setText(initialData.text);
      setDate(initialData.date || getTodayString());
      setTime(initialData.time ?? "09:00");
      setRecurrence(initialData.recurrence ?? "");
      setChannels(initialData.channels.length > 0 ? initialData.channels : ["desktop"]);
    } else {
      setNotePath(availableNotes[0] ?? "Notes/Daily.md");
      setText("");
      setDate(getTodayString());
      setTime("09:00");
      setRecurrence("");
      setChannels(["desktop"]);
    }
    setError(null);
  }, [initialData, availableNotes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Reminder text is required.");
      return;
    }
    if (!notePath.trim()) {
      setError("A target note is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        notePath: notePath.trim(),
        text: text.trim(),
        date,
        time: time || undefined,
        recurrence: recurrence || undefined,
        channels,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reminder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={modalStyles["modal-backdrop"]} onClick={onClose} role="dialog" aria-modal="true">
      <div className={modalStyles["modal-window"]} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles["modal-header"]}>
          <h2 className={modalStyles["modal-title"]}>
            {initialData ? "Edit Reminder" : "New Reminder"}
          </h2>
          <button
            type="button"
            className={modalStyles["modal-close-btn"]}
            onClick={onClose}
            aria-label="Close form"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={modalStyles["modal-form"]}>
          {error && <div className={modalStyles["modal-error"]}>{error}</div>}

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>
              <FileText size={14} />
              <span>Target Note</span>
            </label>
            <select
              className={modalStyles["form-select"]}
              value={notePath}
              onChange={(e) => setNotePath(e.target.value)}
            >
              {availableNotes.length === 0 ? (
                <option value={notePath}>{notePath || "No notes available"}</option>
              ) : (
                availableNotes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>Reminder Text</label>
            <input
              type="text"
              className={modalStyles["form-input"]}
              placeholder="e.g. Submit quarterly tax report"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>

          <div className={modalStyles["form-row"]}>
            <div className={modalStyles["form-field"]}>
              <label className={modalStyles["form-label"]}>
                <CalendarBlank size={14} />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                className={modalStyles["form-input"]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={modalStyles["form-field"]}>
              <label className={modalStyles["form-label"]}>
                <Clock size={14} />
                <span>Time (optional)</span>
              </label>
              <input
                type="time"
                className={modalStyles["form-input"]}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>
              <Repeat size={14} />
              <span>Repeat</span>
            </label>
            <select
              className={modalStyles["form-select"]}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as ReminderFormData["recurrence"])}
            >
              <option value="">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <ChannelPickerField selectedChannels={channels} onChange={setChannels} />

          <div className={modalStyles["modal-actions"]}>
            <button
              type="button"
              className={styles["btn--secondary"]}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles["btn--primary"]}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
