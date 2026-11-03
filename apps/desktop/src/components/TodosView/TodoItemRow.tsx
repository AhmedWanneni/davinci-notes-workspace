import { useState, useCallback, type KeyboardEvent, type JSX } from "react";
import {
  Bell,
  Check,
  FileText,
  Link as LinkIcon,
  PencilSimple,
  Target,
} from "@phosphor-icons/react";
import type { TodoItem } from "./types";
import { TodoReminderQuickPicker } from "./TodoReminderQuickPicker";
import styles from "./TodoItemRow.module.scss";

export interface TodoItemRowProps {
  todo: TodoItem;
  onToggle: (todo: TodoItem) => void;
  onUpdateText: (todo: TodoItem, newText: string) => void;
  onAddLink: (todo: TodoItem, noteName: string) => void;
  onAddReminder: (todo: TodoItem, dateStr: string) => void;
  onOpenNote?: (path: string) => void;
  onEnterFocus?: (todo: TodoItem) => void;
  allNotePaths?: readonly string[];
}

export function TodoItemRow({
  todo,
  onToggle,
  onUpdateText,
  onAddLink,
  onAddReminder,
  onOpenNote,
  onEnterFocus,
  allNotePaths = [],
}: TodoItemRowProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(todo.text);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const handleCommitEdit = useCallback(() => {
    setIsEditing(false);
    if (draftText.trim() && draftText !== todo.text) {
      onUpdateText(todo, draftText);
    }
  }, [draftText, onUpdateText, todo]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCommitEdit();
      } else if (e.key === "Escape") {
        setDraftText(todo.text);
        setIsEditing(false);
      }
    },
    [handleCommitEdit, todo.text],
  );

  return (
    <div
      className={`${styles["todo-row"]} ${todo.completed ? styles["is-completed"] : ""}`}
      data-testid={`todo-row-${todo.id}`}
    >
      <div className={styles["todo-row__left"]}>
        <button
          type="button"
          className={`${styles["todo-row__checkbox"]} ${todo.completed ? styles["is-checked"] : ""}`}
          onClick={() => onToggle(todo)}
          aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        >
          {todo.completed && <Check size={12} weight="bold" />}
        </button>

        <div className={styles["todo-row__content"]}>
          {isEditing ? (
            <input
              type="text"
              className={styles["todo-row__edit-input"]}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <span
              className={styles["todo-row__text"]}
              onDoubleClick={() => setIsEditing(true)}
            >
              {todo.text}
            </span>
          )}

          {todo.dueDate && (
            <span className={styles["todo-row__badge"]} title="Due date">
              {todo.dueDate}
            </span>
          )}

          {todo.label && (
            <span className={styles["todo-row__badge"]}>{todo.label}</span>
          )}

          {todo.subtasksCount !== undefined && (
            <span className={styles["todo-row__badge"]}>
              := {todo.subtasksCount}
            </span>
          )}

          {todo.linkedNotePath && (
            <button
              type="button"
              className={styles["todo-row__link-badge"]}
              onClick={() => onOpenNote?.(todo.linkedNotePath!)}
              title={`Open linked note: ${todo.linkedNotePath}`}
            >
              <FileText size={12} />
              <span>{todo.linkedNotePath.replace(/\.md$/, "")}</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles["todo-row__actions"]}>
        <button
          type="button"
          className={styles["todo-row__btn"]}
          onClick={() => setIsEditing(true)}
          title="Edit text"
        >
          <PencilSimple size={14} />
        </button>

        <button
          type="button"
          className={`${styles["todo-row__btn"]} ${showLinkPicker ? styles["is-active"] : ""}`}
          onClick={() => setShowLinkPicker((v) => !v)}
          title="Link to note"
        >
          <LinkIcon size={14} />
        </button>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={`${styles["todo-row__btn"]} ${todo.hasReminder ? styles["is-active"] : ""}`}
            onClick={() => setShowReminderPicker((v) => !v)}
            title={todo.hasReminder ? "Reminder active" : "Add reminder"}
          >
            <Bell size={14} weight={todo.hasReminder ? "fill" : "regular"} />
          </button>
          <TodoReminderQuickPicker
            isOpen={showReminderPicker}
            onClose={() => setShowReminderPicker(false)}
            onSetReminder={(dateStr) => onAddReminder(todo, dateStr)}
            hasReminder={todo.hasReminder}
          />
        </div>

        {onEnterFocus && (
          <button
            type="button"
            className={styles["todo-row__btn"]}
            onClick={() => onEnterFocus(todo)}
            title="Focus mode"
          >
            <Target size={14} />
          </button>
        )}
      </div>

      {showLinkPicker && allNotePaths.length > 0 && (
        <select
          className={styles["todo-row__badge"]}
          onChange={(e) => {
            if (e.target.value) {
              onAddLink(todo, e.target.value);
              setShowLinkPicker(false);
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Select note to link...
          </option>
          {allNotePaths.map((p) => (
            <option key={p} value={p}>
              {p.replace(/\.md$/, "")}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
