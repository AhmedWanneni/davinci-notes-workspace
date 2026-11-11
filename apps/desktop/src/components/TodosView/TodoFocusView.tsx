import { useState, useCallback, useMemo, useEffect, type JSX } from "react";
import {
  ArrowLeft,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Plus,
  X,
} from "@phosphor-icons/react";
import type { TodoItem, TodoProject, TodoSection } from "./types";
import {
  parseCardEmojiAndTitle,
  formatOrdinalDate,
  getSectionPillStyle,
} from "./todoFocusUtils";
import styles from "./TodoFocusView.module.scss";

export interface TodoFocusViewProps {
  project: TodoProject | null;
  sections: TodoSection[];
  onClose: () => void;
  onToggleTodo: (todo: TodoItem) => void;
  onAddTodo: (sectionName: string, text: string) => void;
}

export function TodoFocusView({
  sections,
  onClose,
  onToggleTodo,
  onAddTodo,
}: TodoFocusViewProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const { dayName, dateStr } = useMemo(
    () => formatOrdinalDate(currentDate),
    [currentDate],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleSection = useCallback((name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleDayShift = useCallback((days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }, []);

  return (
    <div
      className={styles["focus-view"]}
      onClick={onClose}
      data-testid="todo-focus-view"
    >
      <div
        className={styles["focus-view__dialog"]}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Focus mode"
      >
        <div className={styles["focus-view__top-bar"]}>
          <button
            type="button"
            className={styles["focus-view__back-btn"]}
            onClick={onClose}
            aria-label="Back to whole app"
          >
            <ArrowLeft size={14} />
            <span>Back to App</span>
          </button>

          <button
            type="button"
            className={styles["focus-view__close-btn"]}
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles["focus-view__container"]}>
          <div className={styles["focus-view__date-header"]}>
            <button
              type="button"
              className={styles["focus-view__nav-arrow"]}
              onClick={() => handleDayShift(-1)}
              aria-label="Previous day"
            >
              <CaretLeft size={18} />
            </button>

            <div className={styles["focus-view__date-center"]}>
              <h1 className={styles["focus-view__day-title"]}>{dayName}</h1>
              <span className={styles["focus-view__date-subtitle"]}>
                {dateStr}
              </span>
            </div>

            <button
              type="button"
              className={styles["focus-view__nav-arrow"]}
              onClick={() => handleDayShift(1)}
              aria-label="Next day"
            >
              <CaretRight size={18} />
            </button>
          </div>

          <button
            type="button"
            className={styles["focus-view__dashed-add"]}
            onClick={() => {
              const sec = sections[0]?.name ?? "General";
              onAddTodo(sec, "New Task");
            }}
          >
            <span>Add task</span>
            <Plus size={14} />
          </button>

          {sections.map((section) => {
            const isCollapsed = Boolean(collapsed[section.name]);
            const { icon, modifier } = getSectionPillStyle(section.name);

            return (
              <div key={section.name} className={styles["focus-view__section"]}>
                <div className={styles["focus-view__section-header"]}>
                  <button
                    type="button"
                    className={`${styles["focus-view__pill"]} ${styles[modifier]}`}
                    onClick={() => toggleSection(section.name)}
                  >
                    <span>
                      {icon} {section.name} ({section.todos.length})
                    </span>
                    {isCollapsed ? (
                      <CaretDown size={12} />
                    ) : (
                      <CaretUp size={12} />
                    )}
                  </button>

                  <button
                    type="button"
                    className={styles["focus-view__add-icon-btn"]}
                    onClick={() => onAddTodo(section.name, "New task")}
                    title={`Add task to ${section.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {!isCollapsed && (
                  <div className={styles["focus-view__card-list"]}>
                    {section.todos.map((todo) => {
                      const { emoji, title, subtitle } = parseCardEmojiAndTitle(
                        todo.text,
                        section.name,
                      );
                      const displaySub =
                        subtitle ||
                        todo.dueDate ||
                        (todo.linkedNotePath ? `[[${todo.linkedNotePath}]]` : "");

                      return (
                        <div
                          key={todo.id}
                          className={`${styles["focus-view__task-card"]} ${todo.completed ? styles["is-completed"] : ""}`}
                        >
                          <div className={styles["focus-view__card-left"]}>
                            <div className={styles["focus-view__emoji-badge"]}>
                              {emoji}
                            </div>
                            <div className={styles["focus-view__card-details"]}>
                              <span className={styles["focus-view__card-title"]}>
                                {title}
                              </span>
                              {displaySub && (
                                <span
                                  className={styles["focus-view__card-subtitle"]}
                                >
                                  {displaySub}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`${styles["focus-view__circle-checkbox"]} ${todo.completed ? styles["is-checked"] : ""}`}
                            onClick={() => onToggleTodo(todo)}
                            aria-label={
                              todo.completed
                                ? "Mark incomplete"
                                : "Mark complete"
                            }
                          >
                            {todo.completed && <Check size={12} weight="bold" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
