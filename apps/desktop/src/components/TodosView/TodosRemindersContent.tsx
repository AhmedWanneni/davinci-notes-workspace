import { useState, useMemo, type KeyboardEvent, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Plus,
  SlidersHorizontal,
  Warning,
} from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import type { ReminderFilter } from "./types";
import { TodoReminderRow } from "./TodoReminderRow";
import styles from "./TodosRemindersContent.module.scss";

export interface TodosRemindersContentProps {
  reminders: readonly ReminderViewItem[];
  searchQuery: string;
  filter: ReminderFilter;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onUpdateText: (item: ReminderViewItem, text: string) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onEdit: (item: ReminderViewItem) => void;
  onDelete: (item: ReminderViewItem) => void;
  onOpenNote?: (path: string, line?: number) => void;
  onOpenFullModal: () => void;
  onAddQuickReminder: (text: string, date: string, notePath: string) => Promise<void>;
  availableNotes: readonly string[];
  defaultNotePath?: string;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TodosRemindersContent({
  reminders,
  searchQuery,
  filter,
  onToggleDone,
  onUpdateText,
  onSnooze,
  onEdit,
  onDelete,
  onOpenNote,
  onOpenFullModal,
  onAddQuickReminder,
  availableNotes,
  defaultNotePath,
}: TodosRemindersContentProps): JSX.Element {
  const [quickText, setQuickText] = useState("");
  const [quickDate, setQuickDate] = useState(getTodayString);
  const [selectedNote, setSelectedNote] = useState(() => defaultNotePath || availableNotes[0] || "Reminders.md");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const filtered = useMemo(() => {
    return reminders.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.text.toLowerCase().includes(q) && !item.notePath.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filter === "overdue") return item.category === "missed" && !item.done;
      if (filter === "today") return item.category === "today" && !item.done;
      if (filter === "upcoming") return item.category === "upcoming" && !item.done;
      if (filter === "completed") return item.done;
      return true;
    });
  }, [reminders, searchQuery, filter]);

  const overdue = useMemo(() => filtered.filter((i) => i.category === "missed" && !i.done), [filtered]);
  const today = useMemo(() => filtered.filter((i) => i.category === "today" && !i.done), [filtered]);
  const upcoming = useMemo(() => filtered.filter((i) => i.category === "upcoming" && !i.done), [filtered]);
  const completed = useMemo(() => filtered.filter((i) => i.done), [filtered]);

  const handleQuickAdd = async () => {
    if (!quickText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddQuickReminder(quickText.trim(), quickDate, selectedNote);
      setQuickText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleQuickAdd();
  };

  const renderSection = (title: string, items: ReminderViewItem[], isOverdue = false) => {
    if (items.length === 0) return null;
    return (
      <section className={styles["todos-reminders__section"]}>
        <div className={styles["todos-reminders__section-header"]}>
          {isOverdue && <Warning size={15} color="#ef4444" weight="bold" />}
          <h2 className={`${styles["todos-reminders__section-title"]} ${isOverdue ? styles["is-overdue"] : ""}`}>
            {title}
          </h2>
          <span className={styles["todos-reminders__count"]}>{items.length}</span>
        </div>
        <div className={styles["todos-reminders__list"]}>
          {items.map((item) => (
            <TodoReminderRow
              key={item.reminderKey}
              item={item}
              onToggleDone={onToggleDone}
              onUpdateText={onUpdateText}
              onSnooze={onSnooze}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenNote={onOpenNote}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={styles["todos-reminders"]} data-testid="todos-reminders-content">
      <div className={styles["todos-reminders__quick-add"]}>
        <input
          type="text"
          className={styles["todos-reminders__quick-input"]}
          placeholder="Quick reminder... (Enter to save)"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Quick reminder text"
        />
        <input
          type="date"
          className={styles["todos-reminders__date-input"]}
          value={quickDate}
          onChange={(e) => setQuickDate(e.target.value)}
          aria-label="Reminder due date"
        />
        {availableNotes.length > 0 && (
          <select
            className={styles["todos-reminders__select"]}
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
            aria-label="Target note"
          >
            {availableNotes.slice(0, 10).map((n) => (
              <option key={n} value={n}>
                {n.replace(/\.md$/, "").split("/").pop()}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className={styles["todos-reminders__btn"]}
          onClick={() => void handleQuickAdd()}
          disabled={!quickText.trim() || isSubmitting}
        >
          <Plus size={13} weight="bold" />
          <span>Add</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-reminders__btn"]} ${styles["todos-reminders__btn--secondary"]}`}
          onClick={onOpenFullModal}
          title="Advanced reminder with channels & recurrence"
          aria-label="Advanced reminder options"
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
          <CheckCircle size={36} style={{ marginBottom: 8, opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
            {searchQuery ? "No matching reminders found" : "No reminders in this view"}
          </p>
        </div>
      ) : (
        <>
          {renderSection("Overdue", overdue, true)}
          {renderSection("Today", today)}
          {renderSection("Upcoming", upcoming)}
          {completed.length > 0 && (
            <section className={styles["todos-reminders__section"]}>
              <button
                type="button"
                className={styles["todos-reminders__toggle-btn"]}
                onClick={() => setShowDone((v) => !v)}
              >
                {showDone ? <CaretDown size={14} /> : <CaretRight size={14} />}
                <span>Completed ({completed.length})</span>
              </button>
              {showDone && (
                <div className={styles["todos-reminders__list"]}>
                  {completed.map((item) => (
                    <TodoReminderRow
                      key={item.reminderKey}
                      item={item}
                      onToggleDone={onToggleDone}
                      onUpdateText={onUpdateText}
                      onSnooze={onSnooze}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenNote={onOpenNote}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
