// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TodosRemindersContent } from "./TodosRemindersContent";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";

const sampleReminders: ReminderViewItem[] = [
  {
    id: 1,
    reminderKey: "rem-1",
    notePath: "todos/Design/Admin Dashboard.md",
    line: 5,
    dueAtUtc: "2026-11-01T10:00:00Z",
    tz: "UTC",
    text: "Overdue sprint planning",
    done: false,
    status: null,
    snoozeUntilUtc: null,
    effectiveDueUtc: "2026-11-01T10:00:00Z",
    category: "missed",
    channels: ["desktop"],
    deliveryError: null,
  },
  {
    id: 2,
    reminderKey: "rem-2",
    notePath: "todos/Daily/Daily Focus.md",
    line: 12,
    dueAtUtc: "2026-11-03T18:00:00Z",
    tz: "UTC",
    text: "Today gym session",
    done: false,
    status: null,
    snoozeUntilUtc: null,
    effectiveDueUtc: "2026-11-03T18:00:00Z",
    category: "today",
    channels: ["desktop"],
    deliveryError: null,
  },
];

describe("TodosRemindersContent", () => {
  it("renders Overdue and Today sections and items", () => {
    render(
      <TodosRemindersContent
        reminders={sampleReminders}
        searchQuery=""
        filter="all"
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenFullModal={vi.fn()}
        onAddQuickReminder={vi.fn().mockResolvedValue(undefined)}
        availableNotes={["todos/Design/Admin Dashboard.md"]}
      />,
    );

    expect(screen.getByText("Overdue")).toBeDefined();
    expect(screen.getByText("Overdue sprint planning")).toBeDefined();
    expect(screen.getByText("Today")).toBeDefined();
    expect(screen.getByText("Today gym session")).toBeDefined();
  });

  it("submits quick add reminder when Enter is pressed", async () => {
    const onAddQuickReminder = vi.fn().mockResolvedValue(undefined);
    render(
      <TodosRemindersContent
        reminders={sampleReminders}
        searchQuery=""
        filter="all"
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenFullModal={vi.fn()}
        onAddQuickReminder={onAddQuickReminder}
        availableNotes={["todos/Design/Admin Dashboard.md"]}
      />,
    );

    const input = screen.getByLabelText("Quick reminder text");
    fireEvent.change(input, { target: { value: "Call client" } });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(onAddQuickReminder).toHaveBeenCalledWith(
      "Call client",
      expect.any(String),
      "todos/Design/Admin Dashboard.md",
    );
  });
});
