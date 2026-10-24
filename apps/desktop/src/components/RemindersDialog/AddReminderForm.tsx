import { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import { appendToNoteInVault } from "../../vault/appendToNoteInVault";
import styles from "./AddReminderForm.module.scss";

export interface AddReminderFormProps {
  onAdded: () => void;
  onCancel: () => void;
  defaultNotePath?: string | null;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AddReminderForm({
  onAdded,
  onCancel,
  defaultNotePath,
}: AddReminderFormProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [time, setTime] = useState("09:00");
  const [notePath, setNotePath] = useState(
    defaultNotePath && defaultNotePath.endsWith(".md")
      ? defaultNotePath
      : "Reminders.md",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreset = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setDate(formatDate(target));
  };

  const handleSubmit = async () => {
    const cleanText = text.trim();
    if (!cleanText || !date) return;

    setIsSubmitting(true);
    try {
      const cleanTarget = notePath.trim() || "Reminders.md";
      const file = cleanTarget.endsWith(".md") ? cleanTarget : `${cleanTarget}.md`;
      const timePart = time.trim() ? ` ${time.trim()}` : "";
      const reminderLine = `- [ ] ${cleanText} (@${date}${timePart})`;

      await appendToNoteInVault(file, reminderLine);
      onAdded();
    } catch (err) {
      console.error("Failed to add reminder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles["add-reminder-form"]} role="form" aria-label="Add a reminder">
      <div className={styles["add-reminder-form__field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Reminder Task
        </Typography>
        <Input
          size="sm"
          placeholder="What do you want to be reminded about?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          aria-label="Reminder Task Title"
        />
      </div>

      <div className={styles["add-reminder-form__presets"]}>
        <button
          type="button"
          className={styles["add-reminder-form__preset-btn"]}
          onClick={() => handlePreset(0)}
        >
          Today
        </button>
        <button
          type="button"
          className={styles["add-reminder-form__preset-btn"]}
          onClick={() => handlePreset(1)}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={styles["add-reminder-form__preset-btn"]}
          onClick={() => handlePreset(7)}
        >
          Next week
        </button>
      </div>

      <div className={styles["add-reminder-form__row"]}>
        <div className={styles["add-reminder-form__field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Due Date
          </Typography>
          <Input
            size="sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Due Date"
          />
        </div>
        <div className={styles["add-reminder-form__field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Time (optional)
          </Typography>
          <Input
            size="sm"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Due Time"
          />
        </div>
      </div>

      <div className={styles["add-reminder-form__field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Save in Note
        </Typography>
        <Input
          size="sm"
          placeholder="Note name (e.g. Reminders.md)"
          value={notePath}
          onChange={(e) => setNotePath(e.target.value)}
          aria-label="Target note for reminder"
        />
      </div>

      <div className={styles["add-reminder-form__actions"]}>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => void handleSubmit()}
          disabled={!text.trim() || !date || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add reminder"}
        </Button>
      </div>
    </div>
  );
}
