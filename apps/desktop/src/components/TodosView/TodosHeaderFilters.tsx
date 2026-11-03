import type { JSX } from "react";
import type {
  ReminderFilter,
  ScheduledFilter,
  TodoStatusFilter,
  TodoViewMode,
} from "./types";
import styles from "./TodosHeader.module.scss";

export interface TodosHeaderFiltersProps {
  viewMode: TodoViewMode;
  reminderFilter: ReminderFilter;
  onSelectReminderFilter?: (filter: ReminderFilter) => void;
  scheduledFilter: ScheduledFilter;
  onSelectScheduledFilter?: (filter: ScheduledFilter) => void;
  selectedMonth: string;
  onSelectMonth?: (m: string) => void;
  monthsMap: Map<string, number>;
  statusFilter: TodoStatusFilter;
  onSelectStatus?: (status: TodoStatusFilter) => void;
  totalTodos: number;
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

export function TodosHeaderFilters({
  viewMode,
  reminderFilter,
  onSelectReminderFilter,
  scheduledFilter,
  onSelectScheduledFilter,
  selectedMonth,
  onSelectMonth,
  monthsMap,
  statusFilter,
  onSelectStatus,
  totalTodos,
  remindersCounts,
  scheduledCounts,
}: TodosHeaderFiltersProps): JSX.Element {
  const months = Array.from(monthsMap.entries());

  if (viewMode === "reminders" && onSelectReminderFilter) {
    return (
      <div className={styles["todos-header__filters"]}>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${reminderFilter === "all" ? styles["is-active"] : ""}`}
          onClick={() => onSelectReminderFilter("all")}
        >
          <span>All</span>
          <span>({remindersCounts?.all ?? 0})</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${reminderFilter === "overdue" ? styles["is-active"] : ""}`}
          onClick={() => onSelectReminderFilter("overdue")}
        >
          <span>Overdue</span>
          <span>({remindersCounts?.overdue ?? 0})</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${reminderFilter === "today" ? styles["is-active"] : ""}`}
          onClick={() => onSelectReminderFilter("today")}
        >
          <span>Today</span>
          <span>({remindersCounts?.today ?? 0})</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${reminderFilter === "upcoming" ? styles["is-active"] : ""}`}
          onClick={() => onSelectReminderFilter("upcoming")}
        >
          <span>Upcoming</span>
          <span>({remindersCounts?.upcoming ?? 0})</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${reminderFilter === "completed" ? styles["is-active"] : ""}`}
          onClick={() => onSelectReminderFilter("completed")}
        >
          <span>Completed</span>
          <span>({remindersCounts?.completed ?? 0})</span>
        </button>
      </div>
    );
  }

  if (viewMode === "scheduled" && onSelectScheduledFilter) {
    return (
      <div className={styles["todos-header__filters"]}>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${scheduledFilter === "all" ? styles["is-active"] : ""}`}
          onClick={() => onSelectScheduledFilter("all")}
        >
          <span>All</span>
          <span>({scheduledCounts?.all ?? 0})</span>
        </button>
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${scheduledFilter === "scheduled" ? styles["is-active"] : ""}`}
          onClick={() => onSelectScheduledFilter("scheduled")}
        >
          <span>Scheduled</span>
          <span>({scheduledCounts?.scheduled ?? 0})</span>
        </button>
        {(scheduledCounts?.needsSend ?? 0) > 0 && (
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${scheduledFilter === "needs_manual_send" ? styles["is-active"] : ""}`}
            onClick={() => onSelectScheduledFilter("needs_manual_send")}
          >
            <span>Needs Send</span>
            <span>({scheduledCounts?.needsSend ?? 0})</span>
          </button>
        )}
        {(scheduledCounts?.missed ?? 0) > 0 && (
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${scheduledFilter === "missed" ? styles["is-active"] : ""}`}
            onClick={() => onSelectScheduledFilter("missed")}
          >
            <span>Missed</span>
            <span>({scheduledCounts?.missed ?? 0})</span>
          </button>
        )}
        <button
          type="button"
          className={`${styles["todos-header__filter-pill"]} ${scheduledFilter === "sent" ? styles["is-active"] : ""}`}
          onClick={() => onSelectScheduledFilter("sent")}
        >
          <span>Sent</span>
          <span>({scheduledCounts?.sent ?? 0})</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles["todos-header__filters"]}>
      {onSelectMonth && (
        <>
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
        </>
      )}

      {onSelectStatus && (
        <>
          <div className={styles["todos-header__filter-divider"]} />
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${statusFilter === "all" ? styles["is-active"] : ""}`}
            onClick={() => onSelectStatus("all")}
          >
            <span>All Status</span>
          </button>
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${statusFilter === "pending" ? styles["is-active"] : ""}`}
            onClick={() => onSelectStatus("pending")}
          >
            <span>Pending</span>
          </button>
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${statusFilter === "completed" ? styles["is-active"] : ""}`}
            onClick={() => onSelectStatus("completed")}
          >
            <span>Completed</span>
          </button>
          <button
            type="button"
            className={`${styles["todos-header__filter-pill"]} ${statusFilter === "dated" ? styles["is-active"] : ""}`}
            onClick={() => onSelectStatus("dated")}
          >
            <span>With Due Date</span>
          </button>
        </>
      )}
    </div>
  );
}
