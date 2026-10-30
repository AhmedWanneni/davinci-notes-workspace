import { useState, useRef, type KeyboardEvent } from "react";
import { Button, Typography } from "@app/design-system";
import styles from "./QuickCaptureReminder.module.scss";

export interface QuickCaptureReminderProps {
  onSaveReminder: (
    text: string,
    filename?: string,
    folder?: string,
  ) => Promise<void> | void;
  onDismiss: () => void;
  folder: string;
  onFolderChange: (folder: string) => void;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function QuickCaptureReminder({
  onSaveReminder,
  onDismiss,
  folder,
  onFolderChange,
}: QuickCaptureReminderProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [time, setTime] = useState("09:00");
  const [filename, setFilename] = useState("Reminders.md");
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePreset = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setDate(formatDate(target));
  };

  const handleSave = async () => {
    const cleanText = text.trim();
    if (!cleanText || !date) return;

    const timePart = time.trim() ? ` ${time.trim()}` : "";
    const reminderLine = `- [ ] ${cleanText} (@${date}${timePart})`;
    const targetFile = filename.trim() || "Reminders.md";
    const file = targetFile.endsWith(".md") ? targetFile : `${targetFile}.md`;

    await onSaveReminder(reminderLine, file, folder.trim() || undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" ||
      ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter"))
    ) {
      e.preventDefault();
      void handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  };

  return (
    <div
      className={styles["reminder-container"]}
      role="region"
      aria-label="Quick reminder section"
    >
      <div className={styles["reminder-field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Reminder Task
        </Typography>
        <input
          ref={inputRef}
          className={styles["reminder-input"]}
          placeholder="What do you want to be reminded of? (e.g. Call dentist)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Reminder task text"
        />
      </div>

      <div className={styles["reminder-presets"]}>
        <button
          type="button"
          className={styles["reminder-preset-btn"]}
          onClick={() => handlePreset(0)}
        >
          Today
        </button>
        <button
          type="button"
          className={styles["reminder-preset-btn"]}
          onClick={() => handlePreset(1)}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={styles["reminder-preset-btn"]}
          onClick={() => handlePreset(7)}
        >
          Next week
        </button>
      </div>

      <div className={styles["reminder-row"]}>
        <div className={styles["reminder-field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Due Date
          </Typography>
          <input
            type="date"
            className={styles["reminder-input"]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Due date"
          />
        </div>
        <div className={styles["reminder-field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Time (optional)
          </Typography>
          <input
            type="time"
            className={styles["reminder-input"]}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Due time"
          />
        </div>
      </div>

      <div className={styles["reminder-row"]}>
        <div className={styles["reminder-field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Save in Note
          </Typography>
          <input
            className={styles["reminder-input"]}
            placeholder="Reminders.md"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Reminder note name"
          />
        </div>
        <div className={styles["reminder-field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Folder (optional)
          </Typography>
          <input
            className={styles["reminder-input"]}
            placeholder="e.g. Daily"
            value={folder}
            onChange={(e) => onFolderChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Reminder folder"
          />
        </div>
      </div>

      <div className={styles["reminder-actions"]}>
        <div className={styles["reminder-hints"]}>
          <span>
            <kbd className={styles["reminder-kbd"]}>⌘S</kbd> Save
          </span>
          <span>
            <kbd className={styles["reminder-kbd"]}>Esc</kbd> Cancel
          </span>
        </div>
        <div className={styles["reminder-buttons"]}>
          <Button size="sm" variant="secondary" onClick={onDismiss}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={!text.trim() || !date}
          >
            Save reminder
          </Button>
        </div>
      </div>
    </div>
  );
}
