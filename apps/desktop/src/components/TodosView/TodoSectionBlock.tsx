import { useState, type JSX } from "react";
import { Plus } from "@phosphor-icons/react";
import type { TodoItem, TodoSection } from "./types";
import { TodoItemRow } from "./TodoItemRow";
import styles from "./TodosView.module.scss";

export interface TodoSectionBlockProps {
  section: TodoSection;
  onToggle: (todo: TodoItem) => void;
  onUpdateText: (todo: TodoItem, text: string) => void;
  onAddLink: (todo: TodoItem, link: string) => void;
  onAddReminder: (todo: TodoItem, dateStr: string) => void;
  onOpenNote?: (path: string) => void;
  onEnterFocus: () => void;
  allNotePaths: string[];
  onAddTodo: (sectionName: string, text: string) => Promise<void>;
}

export function TodoSectionBlock({
  section,
  onToggle,
  onUpdateText,
  onAddLink,
  onAddReminder,
  onOpenNote,
  onEnterFocus,
  allNotePaths,
  onAddTodo,
}: TodoSectionBlockProps): JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [draftText, setDraftText] = useState("");

  const handleCreate = async () => {
    if (draftText.trim()) {
      await onAddTodo(section.name, draftText.trim());
      setDraftText("");
      setIsAdding(false);
    }
  };

  return (
    <section className={styles["todos-view__section"]}>
      <div className={styles["todos-view__section-header"]}>
        <h2 className={styles["todos-view__section-title"]}>{section.name}</h2>
      </div>

      <div className={styles["todos-view__list"]}>
        {section.todos.map((todo) => (
          <TodoItemRow
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onUpdateText={onUpdateText}
            onAddLink={onAddLink}
            onAddReminder={onAddReminder}
            onOpenNote={onOpenNote}
            onEnterFocus={onEnterFocus}
            allNotePaths={allNotePaths}
          />
        ))}

        {isAdding ? (
          <div className={styles["todos-view__add-row"]}>
            <input
              type="text"
              placeholder="Add task... (Enter to save)"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
                if (e.key === "Escape") setIsAdding(false);
              }}
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: 12,
              cursor: "pointer",
              padding: "6px 10px",
            }}
            onClick={() => {
              setIsAdding(true);
              setDraftText("");
            }}
          >
            <Plus size={14} />
            <span>Add task</span>
          </button>
        )}
      </div>
    </section>
  );
}
