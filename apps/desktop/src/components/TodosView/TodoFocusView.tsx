import { useState, useCallback, useMemo, type JSX } from "react";
import {
  ArrowLeft,
  ArrowUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Microphone,
  Plus,
} from "@phosphor-icons/react";
import type { TodoItem, TodoProject, TodoSection } from "./types";
import { parseCardEmojiAndTitle, formatOrdinalDate, getSectionPillStyle } from "./todoFocusUtils";
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
  const [floatingInput, setFloatingInput] = useState("");

  const { dayName, dateStr } = useMemo(() => formatOrdinalDate(currentDate), [currentDate]);

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

  const handleCreateTask = useCallback(() => {
    if (!floatingInput.trim()) return;
    const targetSection = sections[0]?.name ?? "Morning";
    onAddTodo(targetSection, floatingInput.trim());
    setFloatingInput("");
  }, [floatingInput, onAddTodo, sections]);

  return (
    <div className={styles["focus-view"]} data-testid="todo-focus-view">
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
            <span className={styles["focus-view__date-subtitle"]}>{dateStr}</span>
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
                  <span>{icon} {section.name} ({section.todos.length})</span>
                  {isCollapsed ? <CaretDown size={12} /> : <CaretUp size={12} />}
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
                    const { emoji, title, subtitle } = parseCardEmojiAndTitle(todo.text, section.name);
                    const displaySub = subtitle || todo.dueDate || (todo.linkedNotePath ? `[[${todo.linkedNotePath}]]` : "");

                    return (
                      <div
                        key={todo.id}
                        className={`${styles["focus-view__task-card"]} ${todo.completed ? styles["is-completed"] : ""}`}
                      >
                        <div className={styles["focus-view__card-left"]}>
                          <div className={styles["focus-view__emoji-badge"]}>{emoji}</div>
                          <div className={styles["focus-view__card-details"]}>
                            <span className={styles["focus-view__card-title"]}>{title}</span>
                            {displaySub && (
                              <span className={styles["focus-view__card-subtitle"]}>{displaySub}</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`${styles["focus-view__circle-checkbox"]} ${todo.completed ? styles["is-checked"] : ""}`}
                          onClick={() => onToggleTodo(todo)}
                          aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
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

      <div className={styles["focus-view__floating-bar"]}>
        <div className={styles["focus-view__cursor-bar"]} />
        <input
          type="text"
          className={styles["focus-view__floating-input"]}
          placeholder="Create task"
          value={floatingInput}
          onChange={(e) => setFloatingInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateTask();
          }}
        />
        <button type="button" className={styles["focus-view__mic-btn"]} title="Voice input">
          <Microphone size={18} />
        </button>
        <button
          type="button"
          className={styles["focus-view__submit-btn"]}
          onClick={handleCreateTask}
          title="Submit task"
          aria-label="Submit task"
        >
          <ArrowUp size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
