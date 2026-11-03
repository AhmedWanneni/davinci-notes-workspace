// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodosHeaderFilters } from "./TodosHeaderFilters";

describe("TodosHeaderFilters", () => {
  it("renders reminder filters when in reminders mode", () => {
    const onSelectReminderFilter = vi.fn();
    render(
      <TodosHeaderFilters
        viewMode="reminders"
        reminderFilter="all"
        onSelectReminderFilter={onSelectReminderFilter}
        scheduledFilter="all"
        selectedMonth="all"
        monthsMap={new Map()}
        statusFilter="all"
        totalTodos={0}
        remindersCounts={{ all: 10, overdue: 1, today: 2, upcoming: 3, completed: 4 }}
      />,
    );

    expect(screen.getByText("Overdue")).toBeDefined();
    expect(screen.getByText("(1)")).toBeDefined();

    fireEvent.click(screen.getByText("Overdue"));
    expect(onSelectReminderFilter).toHaveBeenCalledWith("overdue");
  });

  it("renders scheduled message filters when in scheduled mode", () => {
    const onSelectScheduledFilter = vi.fn();
    render(
      <TodosHeaderFilters
        viewMode="scheduled"
        reminderFilter="all"
        scheduledFilter="all"
        onSelectScheduledFilter={onSelectScheduledFilter}
        selectedMonth="all"
        monthsMap={new Map()}
        statusFilter="all"
        totalTodos={0}
        scheduledCounts={{ all: 3, scheduled: 2, needsSend: 1, missed: 0, sent: 0 }}
      />,
    );

    expect(screen.getByText("Needs Send")).toBeDefined();
    fireEvent.click(screen.getByText("Needs Send"));
    expect(onSelectScheduledFilter).toHaveBeenCalledWith("needs_manual_send");
  });
});
