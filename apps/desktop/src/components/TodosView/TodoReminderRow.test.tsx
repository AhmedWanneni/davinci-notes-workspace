// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoReminderRow } from "./TodoReminderRow";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";

const sampleReminder: ReminderViewItem = {
  id: 1,
  reminderKey: "rem-1",
  notePath: "todos/Design/Admin Dashboard.md",
  line: 5,
  dueAtUtc: "2026-11-03T17:00:00Z",
  tz: "UTC",
  text: "Review dashboard wireframes",
  done: false,
  status: null,
  snoozeUntilUtc: null,
  effectiveDueUtc: "2026-11-03T17:00:00Z",
  category: "today",
  channels: ["desktop", "whatsapp"],
  deliveryError: null,
};

describe("TodoReminderRow", () => {
  it("renders reminder text, due badge, note link, and channel badges", () => {
    render(
      <TodoReminderRow
        item={sampleReminder}
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenNote={vi.fn()}
      />,
    );

    expect(screen.getByText("Review dashboard wireframes")).toBeDefined();
    expect(screen.getByText("Admin Dashboard")).toBeDefined();
    expect(screen.getByText("desktop")).toBeDefined();
    expect(screen.getByText("whatsapp")).toBeDefined();
  });

  it("toggles done state on checkbox click", () => {
    const onToggleDone = vi.fn();
    render(
      <TodoReminderRow
        item={sampleReminder}
        onToggleDone={onToggleDone}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark complete" });
    fireEvent.click(checkbox);
    expect(onToggleDone).toHaveBeenCalledWith(sampleReminder, true);
  });

  it("calls onOpenNote when clicking the note link", () => {
    const onOpenNote = vi.fn();
    render(
      <TodoReminderRow
        item={sampleReminder}
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenNote={onOpenNote}
      />,
    );

    const noteLink = screen.getByTitle("Open note todos/Design/Admin Dashboard.md:5");
    fireEvent.click(noteLink);
    expect(onOpenNote).toHaveBeenCalledWith("todos/Design/Admin Dashboard.md", 5);
  });

  it("opens snooze menu and triggers onSnooze", () => {
    const onSnooze = vi.fn();
    render(
      <TodoReminderRow
        item={sampleReminder}
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={onSnooze}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const snoozeBtn = screen.getByTitle("Snooze reminder");
    fireEvent.click(snoozeBtn);

    const preset1h = screen.getByText("1 hour");
    fireEvent.click(preset1h);
    expect(onSnooze).toHaveBeenCalledWith(sampleReminder, "1h");
  });

  it("triggers onEdit and onDelete when clicking actions", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <TodoReminderRow
        item={sampleReminder}
        onToggleDone={vi.fn()}
        onUpdateText={vi.fn()}
        onSnooze={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByTitle("Edit reminder"));
    expect(onEdit).toHaveBeenCalledWith(sampleReminder);

    fireEvent.click(screen.getByTitle("Delete reminder"));
    expect(onDelete).toHaveBeenCalledWith(sampleReminder);
  });
});
