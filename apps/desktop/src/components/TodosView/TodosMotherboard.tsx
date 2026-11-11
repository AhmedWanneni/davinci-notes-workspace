import type { JSX } from "react";
import { Check, FileText, Folder, Target } from "@phosphor-icons/react";
import type { TodoItem } from "./types";
import { TodoItemRow } from "./TodoItemRow";
import styles from "./TodosMotherboard.module.scss";

export interface TodosMotherboardProps {
  todos: TodoItem[];
  layout: "cards" | "list";
  onToggleTodo: (todo: TodoItem) => void;
  onUpdateText: (todo: TodoItem, text: string) => void;
  onAddLink: (todo: TodoItem, link: string) => void;
  onAddReminder: (todo: TodoItem, dateStr: string) => void;
  onOpenNote?: (path: string) => void;
  onSelectProject?: (notePath: string) => void;
  onEnterFocus: (todo?: TodoItem) => void;
  allNotePaths: string[];
}

export function TodosMotherboard({
  todos,
  layout,
  onToggleTodo,
  onUpdateText,
  onAddLink,
  onAddReminder,
  onOpenNote,
  onSelectProject,
  onEnterFocus,
  allNotePaths,
}: TodosMotherboardProps): JSX.Element {
  if (todos.length === 0) {
    return (
      <div className={styles["motherboard__empty"]}>
        <span>No tasks found matching your filter criteria</span>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className={styles["motherboard__list"]} data-testid="motherboard-list">
        {todos.map((todo) => (
          <div key={todo.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {todo.project && (
              <div style={{ paddingLeft: 30, fontSize: 11, color: "var(--color-text-muted)" }}>
                <span>📁 {todo.project} &rsaquo; {todo.section}</span>
              </div>
            )}
            <TodoItemRow
              todo={todo}
              onToggle={onToggleTodo}
              onUpdateText={onUpdateText}
              onAddLink={onAddLink}
              onAddReminder={onAddReminder}
              onOpenNote={onOpenNote}
              onEnterFocus={() => onEnterFocus(todo)}
              allNotePaths={allNotePaths}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles["motherboard__cards"]} data-testid="motherboard-cards">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`${styles["motherboard__card"]} ${todo.completed ? styles["is-completed"] : ""}`}
        >
          <div className={styles["motherboard__card-header"]}>
            {todo.project && (
              <button
                type="button"
                className={styles["motherboard__project-badge"]}
                onClick={() => onSelectProject?.(todo.notePath)}
                title={`Open project: ${todo.project}`}
              >
                <Folder size={12} />
                <span>{todo.project}</span>
              </button>
            )}

            <button
              type="button"
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
              }}
              onClick={() => onEnterFocus(todo)}
              title="Focus task"
            >
              <Target size={14} />
            </button>
          </div>

          <div className={styles["motherboard__card-body"]}>
            <button
              type="button"
              className={`${styles["motherboard__checkbox"]} ${todo.completed ? styles["is-checked"] : ""}`}
              onClick={() => onToggleTodo(todo)}
              aria-label={todo.completed ? "Mark task incomplete" : "Mark task complete"}
            >
              {todo.completed && <Check size={12} weight="bold" />}
            </button>
            <span className={styles["motherboard__card-text"]}>{todo.text}</span>
          </div>

          {(todo.dueDate || todo.linkedNotePath || todo.subtasksCount || todo.label) && (
            <div className={styles["motherboard__card-footer"]}>
              {todo.dueDate && (
                <span className={styles["motherboard__badge"]}>
                  📅 {todo.dueDate}
                </span>
              )}
              {todo.label && (
                <span className={styles["motherboard__badge"]}>
                  🏷️ {todo.label}
                </span>
              )}
              {todo.subtasksCount !== undefined && (
                <span className={styles["motherboard__badge"]}>
                  := {todo.subtasksCount}
                </span>
              )}
              {todo.linkedNotePath && (
                <button
                  type="button"
                  className={styles["motherboard__link-badge"]}
                  onClick={() => onOpenNote?.(todo.linkedNotePath!)}
                  title={`Open linked note: ${todo.linkedNotePath}`}
                >
                  <FileText size={12} />
                  <span>{todo.linkedNotePath.replace(/\.md$/, "")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
