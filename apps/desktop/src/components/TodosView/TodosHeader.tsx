import type { JSX } from "react";
import { MagnifyingGlass, Target } from "@phosphor-icons/react";
import styles from "./TodosHeader.module.scss";

export interface TodosHeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  monthsMap: Map<string, number>;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  totalTodos: number;
  onOpenFocusMode: () => void;
}

export function TodosHeader({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  monthsMap,
  selectedMonth,
  onSelectMonth,
  totalTodos,
  onOpenFocusMode,
}: TodosHeaderProps): JSX.Element {
  const months = Array.from(monthsMap.entries());

  return (
    <header className={styles["todos-header"]} data-testid="todos-header">
      <div className={styles["todos-header__top"]}>
        <div className={styles["todos-header__title-group"]}>
          <h1 className={styles["todos-header__title"]}>{title}</h1>
          {subtitle && <span className={styles["todos-header__subtitle"]}>{subtitle}</span>}
        </div>

        <div className={styles["todos-header__actions"]}>
          <div className={styles["todos-header__search"]}>
            <MagnifyingGlass size={14} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <button
            type="button"
            className={styles["todos-header__focus-btn"]}
            onClick={onOpenFocusMode}
            title="Open Focus Mode"
          >
            <Target size={16} />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      <div className={styles["todos-header__filters"]}>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${selectedMonth === "all" ? styles["is-active"] : ""}`}
          onClick={() => onSelectMonth("all")}
        >
          <span>All Tasks</span>
          <span>({totalTodos})</span>
        </button>

        {months.map(([month, count]) => (
          <button
            key={month}
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${selectedMonth === month ? styles["is-active"] : ""}`}
            onClick={() => onSelectMonth(month)}
          >
            <span>{month}</span>
            <span>({count})</span>
          </button>
        ))}
      </div>
    </header>
  );
}
