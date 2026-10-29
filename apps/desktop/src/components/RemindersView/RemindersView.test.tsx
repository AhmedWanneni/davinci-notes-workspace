// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RemindersView } from "./RemindersView";
import * as remindersQueries from "../../vault/remindersViewQueries";
import * as taskActions from "../../vault/reminderTaskActions";
import * as appendModule from "../../vault/appendToNoteInVault";
import * as scheduledStore from "../../reminders/scheduledMessagesStore";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";

vi.mock("../../vault/appendToNoteInVault", () => ({
  appendToNoteInVault: vi.fn().mockResolvedValue("mocked"),
}));

vi.mock("../../calendar/calendarOutboxWorker", () => ({
  optimisticCreateEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../calendar/calendarSyncRunner", () => ({
  flushAndSyncCalendar: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../vault/remindersViewQueries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../vault/remindersViewQueries")>();
  return {
    ...actual,
    queryRemindersForView: vi.fn(),
    upsertReminderChannelState: vi.fn(),
  };
});

vi.mock("../../reminders/scheduledMessagesStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../reminders/scheduledMessagesStore")>();
  return {
    ...actual,
    listScheduledMessages: vi.fn(),
    createScheduledMessage: vi.fn(),
    cancelScheduledMessage: vi.fn(),
    markScheduledMessageSent: vi.fn(),
    markScheduledMessageFailed: vi.fn(),
  };
});

describe("RemindersView", () => {
  const mockReminders: ReminderViewItem[] = [
    {
      id: 1,
      reminderKey: "r1",
      notePath: "Notes/Daily.md",
      line: 12,
      dueAtUtc: "2026-10-20T10:00:00.000Z",
      tz: "UTC",
      text: "Submit quarterly report",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-20T10:00:00.000Z",
      category: "missed",
      channels: ["desktop", "telegram"],
      deliveryError: null,
    },
    {
      id: 2,
      reminderKey: "r2",
      notePath: "Work/Project.md",
      line: 45,
      dueAtUtc: "2026-10-28T15:00:00.000Z",
      tz: "UTC",
      text: "Team standup meeting",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-28T15:00:00.000Z",
      category: "today",
      channels: ["slack"],
      deliveryError: null,
    },
    {
      id: 3,
      reminderKey: "r3",
      notePath: "Work/Project.md",
      line: 80,
      dueAtUtc: "2026-10-27T09:00:00.000Z",
      tz: "UTC",
      text: "Archive completed task",
      done: true,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: "2026-10-27T09:00:00.000Z",
      category: "done",
      channels: null,
      deliveryError: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(remindersQueries.queryRemindersForView).mockResolvedValue({
      missed: [mockReminders[0]],
      today: [mockReminders[1]],
      upcoming: [],
      done: [mockReminders[2]],
      all: mockReminders,
    });
    vi.mocked(scheduledStore.listScheduledMessages).mockResolvedValue([
      {
        id: "msg-1",
        channelId: "telegram",
        channelKind: "telegram",
        recipientLabel: "123456789",
        messageText: "Scheduled standup reminder",
        dueAtUtc: "2026-10-29T10:00:00.000Z",
        tz: "UTC",
        localDate: "2026-10-29",
        localTime: "10:00",
        recurrenceRule: "daily",
        allowMentions: false,
        status: "scheduled",
        attempts: 0,
        lastError: null,
        lastSentAt: null,
        createdAt: 1730073600000,
        updatedAt: 1730073600000,
      },
    ]);
  });

  it("renders Reminders sections and items", async () => {
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Submit quarterly report")).toBeDefined();
      expect(screen.getByText("Team standup meeting")).toBeDefined();
    });

    expect(screen.getByText("Overdue")).toBeDefined();
    expect(screen.getByText("Today")).toBeDefined();
  });

  it("navigates to note on note link click", async () => {
    const onOpenNote = vi.fn();
    render(<RemindersView onOpenNote={onOpenNote} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Daily:12")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Daily:12"));
    expect(onOpenNote).toHaveBeenCalledWith("Notes/Daily.md", 12);
  });

  it("toggles reminder done state", async () => {
    const toggleSpy = vi.spyOn(taskActions, "markReminderDoneInVault").mockResolvedValue(undefined);
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Submit quarterly report")).toBeDefined();
    });

    const checkbox = screen.getByLabelText('Mark "Submit quarterly report" as done');
    fireEvent.click(checkbox);

    expect(toggleSpy).toHaveBeenCalledWith(
      "Notes/Daily.md",
      { line: 12, text: "Submit quarterly report" },
      true,
    );
  });

  it("switches to Scheduled Messages tab and displays items", async () => {
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Scheduled Messages")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Scheduled Messages"));

    await waitFor(() => {
      expect(screen.getByText("Scheduled standup reminder")).toBeDefined();
      expect(screen.getByText("123456789")).toBeDefined();
    });
  });

  it("opens settings when settings button clicked", async () => {
    const onOpenSettings = vi.fn();
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={onOpenSettings} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Notification Settings")).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText("Notification Settings"));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it("opens add reminder form when Add a reminder button is clicked and cancels it", async () => {
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Add a reminder" })[0]).toBeDefined();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Add a reminder" })[0]);
    expect(screen.getByRole("form", { name: "Add a reminder" })).toBeDefined();
    expect(screen.getByLabelText("Reminder Task Title")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form", { name: "Add a reminder" })).toBeNull();
  });

  it("submits add reminder form and calls appendToNoteInVault", async () => {
    render(<RemindersView onOpenNote={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Add a reminder" })[0]).toBeDefined();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Add a reminder" })[0]);

    const input = screen.getByLabelText("Reminder Task Title");
    fireEvent.change(input, { target: { value: "Review pull request" } });

    const submitBtn = screen.getByRole("button", { name: "Add reminder" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(appendModule.appendToNoteInVault).toHaveBeenCalledWith(
        expect.stringMatching(/\.md$/),
        expect.stringContaining("Review pull request"),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("form", { name: "Add a reminder" })).toBeNull();
    });
  });
});
