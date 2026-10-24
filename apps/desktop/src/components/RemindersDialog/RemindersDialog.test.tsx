// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RemindersDialog } from "./RemindersDialog";
import * as remindersQueries from "../../vault/remindersViewQueries";
import * as taskActions from "../../vault/reminderTaskActions";
import * as snoozeActions from "../../vault/reminderSnoozeActions";

vi.mock("../../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
}));

describe("RemindersDialog component", () => {
  const mockItems: remindersQueries.ReminderViewItem[] = [
    {
      id: 1,
      reminderKey: "key-1",
      notePath: "Work/Project.md",
      line: 4,
      dueAtUtc: "2026-10-14T08:00:00.000Z",
      tz: "UTC",
      text: "Submit report",
      done: false,
      status: "missed",
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-14T08:00:00.000Z",
      category: "missed",
    },
    {
      id: 2,
      reminderKey: "key-2",
      notePath: "Personal/Groceries.md",
      line: 2,
      dueAtUtc: "2026-10-14T18:00:00.000Z",
      tz: "UTC",
      text: "Buy apples",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-14T18:00:00.000Z",
      category: "today",
    },
    {
      id: 3,
      reminderKey: "key-3",
      notePath: "Personal/Groceries.md",
      line: 3,
      dueAtUtc: "2026-10-25T09:00:00.000Z",
      tz: "UTC",
      text: "Future reminder",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-25T09:00:00.000Z",
      category: "upcoming",
    },
  ];

  it("renders tabs and displays section items", async () => {
    vi.spyOn(remindersQueries, "queryRemindersForView").mockResolvedValue({
      missed: [mockItems[0]],
      today: [mockItems[1]],
      upcoming: [mockItems[2]],
      all: mockItems,
    });

    render(
      <RemindersDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelectNote={vi.fn()}
      />,
    );

    await waitFor(() => {
      // By default starts on 'today' tab
      expect(screen.getByText("Buy apples")).toBeDefined();
    });

    // Switch to Overdue tab
    fireEvent.click(screen.getByRole("tab", { name: /Overdue/ }));
    expect(screen.getByText("Submit report")).toBeDefined();

    // Switch to Upcoming tab
    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/ }));
    expect(screen.getByText("Future reminder")).toBeDefined();
  });

  it("navigates to note at line when clicking note title", async () => {
    vi.spyOn(remindersQueries, "queryRemindersForView").mockResolvedValue({
      missed: [],
      today: [mockItems[1]],
      upcoming: [],
      all: [mockItems[1]],
    });

    const onSelectNote = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <RemindersDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onSelectNote={onSelectNote}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Groceries")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Groceries"));
    expect(onSelectNote).toHaveBeenCalledWith("Personal/Groceries.md", 2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("triggers markReminderDoneInVault when Done button or checkbox clicked", async () => {
    vi.spyOn(remindersQueries, "queryRemindersForView").mockResolvedValue({
      missed: [],
      today: [mockItems[1]],
      upcoming: [],
      all: [mockItems[1]],
    });
    const doneSpy = vi
      .spyOn(taskActions, "markReminderDoneInVault")
      .mockResolvedValue(undefined);

    render(
      <RemindersDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelectNote={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(doneSpy).toHaveBeenCalledWith(
      "Personal/Groceries.md",
      { line: 2, text: "Buy apples", dueAtUtc: "2026-10-14T18:00:00.000Z" },
      true,
    );
  });

  it("triggers snoozeReminderAction when snooze preset clicked", async () => {
    vi.spyOn(remindersQueries, "queryRemindersForView").mockResolvedValue({
      missed: [],
      today: [mockItems[1]],
      upcoming: [],
      all: [mockItems[1]],
    });
    const snoozeSpy = vi
      .spyOn(snoozeActions, "snoozeReminderAction")
      .mockResolvedValue(undefined);

    render(
      <RemindersDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelectNote={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Snooze/ })).toBeDefined();
    });

    // Open snooze dropdown
    fireEvent.click(screen.getByRole("button", { name: /Snooze/ }));
    expect(screen.getByText("10 minutes")).toBeDefined();

    // Click '10 minutes'
    fireEvent.click(screen.getByText("10 minutes"));
    expect(snoozeSpy).toHaveBeenCalledWith(
      {
        reminderKey: "key-2",
        notePath: "Personal/Groceries.md",
        dueAtUtc: "2026-10-14T18:00:00.000Z",
        text: "Buy apples",
      },
      expect.any(String),
    );
  });

  it("opens add reminder form when Add a reminder button is clicked", async () => {
    render(
      <RemindersDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelectNote={vi.fn()}
      />,
    );

    const addBtn = screen.getByRole("button", { name: "Add a reminder" });
    fireEvent.click(addBtn);

    expect(screen.getByRole("form", { name: "Add a reminder" })).toBeDefined();
    expect(screen.getByLabelText("Reminder Task Title")).toBeDefined();
  });
});
