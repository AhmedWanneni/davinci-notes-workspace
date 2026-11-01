import { useState, useCallback, type JSX } from "react";
import { ArrowLeft, CaretDown, CaretRight, Check, Plus } from "@phosphor-icons/react";
import type { TodoItem, TodoProject, TodoSection } from "./types";
import styles from "./TodoFocusView.module.scss";

export interface TodoFocusViewProps {
  project: TodoProject | null;
  sections: TodoSection[];
  onClose: () => void;
  onToggleTodo: (todo: TodoItem) => void;
  onAddTodo: (sectionName: string, text: string) => void;
}

export function TodoFocusView({
  project,
  sections,
  onClose,
  onToggleTodo,
  onAddTodo,
}: TodoFocusViewProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState("");

  const toggleSection = useCallback((name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleCreate = useCallback(
    (sectionName: string) => {
      if (draftTask.trim()) {
        onAddTodo(sectionName, draftTask.trim());
        setDraftTask("");
        setAddingSection(null);
      }
    },
    [draftTask, onAddTodo],
  );

  return (
    <div className={styles["focus-view"]} data-testid="todo-focus-view">
      <header className={styles["focus-view__header"]}>
        <button
          type="button"
          className={styles["focus-view__back-btn"]}
          onClick={onClose}
          aria-label="Back to whole app"
        >
          <ArrowLeft size={16} />
          <span>Back to App</span>
        </button>

        <span className={styles["focus-view__title"]}>
          {project?.name ? `${project.name} Focus` : "Focus Mode"}
        </span>

        <div style={{ width: 80 }} />
      </header>

      <main className={styles["focus-view__content"]}>
        {sections.map((section) => {
          const isCollapsed = Boolean(collapsed[section.name]);

          return (
            <div key={section.name} className={styles["focus-view__group"]}>
              <div
                className={styles["focus-view__group-header"]}
                onClick={() => toggleSection(section.name)}
              >
                {isCollapsed ? <CaretRight size={14} /> : <CaretDown size={14} />}
                <span>{section.name}</span>
              </div>

              {!isCollapsed && (
                <div className={styles["focus-view__list"]}>
                  {section.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`${styles["focus-view__item"]} ${todo.completed ? styles["is-completed"] : ""}`}
                    >
                      <button
                        type="button"
                        className={`${styles["focus-view__checkbox"]} ${todo.completed ? styles["is-checked"] : ""}`}
                        onClick={() => onToggleTodo(todo)}
                        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {todo.completed && <Check size={12} weight="bold" />}
                      </button>
                      <span className={styles["focus-view__item-text"]}>{todo.text}</span>
                    </div>
                  ))}

                  {addingSection === section.name ? (
                    <div className={styles["focus-view__add-input"]}>
                      <input
                        type="text"
                        placeholder="Add task..."
                        value={draftTask}
                        onChange={(e) => setDraftTask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreate(section.name);
                          if (e.key === "Escape") setAddingSection(null);
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
                        gap: 4,
                        background: "none",
                        border: "none",
                        color: "var(--color-text-muted)",
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                      onClick={() => {
                        setAddingSection(section.name);
                        setDraftTask("");
                      }}
                    >
                      <Plus size={12} />
                      <span>Add item</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
