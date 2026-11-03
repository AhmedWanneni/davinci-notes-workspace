import type { JSX } from "react";
import {
  Bell,
  ListBullets,
  MagnifyingGlass,
  PaperPlaneTilt,
  SquaresFour,
  Target,
} from "@phosphor-icons/react";
import type {
  MotherboardLayout,
  ReminderFilter,
  ScheduledFilter,
  TodoStatusFilter,
  TodoViewMode,
} from "./types";
import { TodosHeaderFilters } from "./TodosHeaderFilters";
import styles from "./TodosHeader.module.scss";

export interface TodosHeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  monthsMap?: Map<string, number>;
  selectedMonth?: string;
  onSelectMonth?: (m: string) => void;
  statusFilter?: TodoStatusFilter;
  onSelectStatus?: (status: TodoStatusFilter) => void;
  layout?: MotherboardLayout;
  onSelectLayout?: (layout: MotherboardLayout) => void;
  isMotherboard?: boolean;
  totalTodos?: number;
  onOpenFocusMode?: () => void;
  viewMode?: TodoViewMode;
  reminderFilter?: ReminderFilter;
  onSelectReminderFilter?: (filter: ReminderFilter) => void;
  scheduledFilter?: ScheduledFilter;
  onSelectScheduledFilter?: (filter: ScheduledFilter) => void;
  onNewReminder?: () => void;
  onNewScheduledMessage?: () => void;
  remindersCounts?: {
    all: number;
    overdue: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  scheduledCounts?: {
    all: number;
    scheduled: number;
    needsSend: number;
    missed: number;
    sent: number;
  };
}

export function TodosHeader({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  monthsMap = new Map(),
  selectedMonth = "all",
  onSelectMonth,
  statusFilter = "all",
  onSelectStatus,
  layout = "cards",
  onSelectLayout,
  isMotherboard,
  totalTodos = 0,
  onOpenFocusMode,
  viewMode = "motherboard",
  reminderFilter = "all",
  onSelectReminderFilter,
  scheduledFilter = "all",
  onSelectScheduledFilter,
  onNewReminder,
  onNewScheduledMessage,
  remindersCounts,
  scheduledCounts,
}: TodosHeaderProps): JSX.Element {
  return (
    <header className={styles["todos-header"]} data-testid="todos-header">
      <div className={styles["todos-header__top"]}>
        <div className={styles["todos-header__title-group"]}>
          <h1 className={styles["todos-header__title"]}>{title}</h1>
          {subtitle && (
            <span className={styles["todos-header__subtitle"]}>{subtitle}</span>
          )}
        </div>

        <div className={styles["todos-header__actions"]}>
          {viewMode === "motherboard" && isMotherboard && onSelectLayout && (
            <div className={styles["todos-header__layout-toggle"]}>
              <button
                type="button"
                className={`${styles["todos-header__layout-btn"]} ${layout === "cards" ? styles["is-active"] : ""}`}
                onClick={() => onSelectLayout("cards")}
                title="Cards view"
              >
                <SquaresFour size={16} />
              </button>
              <button
                type="button"
                className={`${styles["todos-header__layout-btn"]} ${layout === "list" ? styles["is-active"] : ""}`}
                onClick={() => onSelectLayout("list")}
                title="List view"
              >
                <ListBullets size={16} />
              </button>
            </div>
          )}

          <div className={styles["todos-header__search"]}>
            <MagnifyingGlass size={14} />
            <input
              type="text"
              placeholder={
                viewMode === "reminders"
                  ? "Search reminders..."
                  : viewMode === "scheduled"
                    ? "Search scheduled..."
                    : "Search tasks..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search"
            />
          </div>

          {viewMode === "reminders" && onNewReminder && (
            <button
              type="button"
              className={styles["todos-header__primary-btn"]}
              onClick={onNewReminder}
            >
              <Bell size={14} weight="fill" />
              <span>Add Reminder</span>
            </button>
          )}

          {viewMode === "scheduled" && onNewScheduledMessage && (
            <button
              type="button"
              className={styles["todos-header__primary-btn"]}
              onClick={onNewScheduledMessage}
            >
              <PaperPlaneTilt size={14} weight="fill" />
              <span>Schedule Message</span>
            </button>
          )}

          {(viewMode === "motherboard" || viewMode === "project") &&
            onOpenFocusMode && (
              <button
                type="button"
                className={styles["todos-header__focus-btn"]}
                onClick={onOpenFocusMode}
                title="Open Focus Mode"
              >
                <Target size={16} />
                <span>Focus Mode</span>
              </button>
            )}
        </div>
      </div>

      <TodosHeaderFilters
        viewMode={viewMode}
        reminderFilter={reminderFilter}
        onSelectReminderFilter={onSelectReminderFilter}
        scheduledFilter={scheduledFilter}
        onSelectScheduledFilter={onSelectScheduledFilter}
        selectedMonth={selectedMonth}
        onSelectMonth={onSelectMonth}
        monthsMap={monthsMap}
        statusFilter={statusFilter}
        onSelectStatus={onSelectStatus}
        totalTodos={totalTodos}
        remindersCounts={remindersCounts}
        scheduledCounts={scheduledCounts}
      />
    </header>
  );
}
