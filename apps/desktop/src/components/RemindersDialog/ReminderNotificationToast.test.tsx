// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { ReminderNotificationToast } from "./ReminderNotificationToast";
import * as reminderTaskActions from "../../vault/reminderTaskActions";
import * as reminderSnoozeActions from "../../vault/reminderSnoozeActions";

type EventCallback = (event: { payload: unknown }) => void;
const listeners: Record<string, EventCallback> = {};

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async (eventName: string, callback: EventCallback) => {
    listeners[eventName] = callback;
    return () => {
      delete listeners[eventName];
    };
  }),
}));

describe("ReminderNotificationToast", () => {
  const onSelectNoteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }
  });

  it("renders nothing when there are no active reminders", () => {
    const { container } = render(
      <ReminderNotificationToast onSelectNote={onSelectNoteMock} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders toast when davinci-reminders-due is received with snake_case payload", async () => {
    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });

    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 1,
            reminder_key: "key-1",
            note_path: "Projects/Demo.md",
            line: 12,
            due_at_utc: "2026-10-26T10:00:00Z",
            text: "Submit report",
          },
        ],
      });
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Submit report")).toBeDefined();
    expect(screen.getByText("Projects/Demo.md")).toBeDefined();
    expect(screen.getByRole("alert").getAttribute("data-reminder-toast")).toBe(
      "true",
    );
  });

  it("dismisses toast when close button is clicked", async () => {
    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });

    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 1,
            notePath: "Test.md",
            line: 5,
            dueAtUtc: "2026-10-26T09:00:00Z",
            text: "Task to dismiss",
          },
        ],
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Dismiss notification"));
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("marks reminder done and dismisses toast when Done button is clicked", async () => {
    const markDoneSpy = vi
      .spyOn(reminderTaskActions, "markReminderDoneInVault")
      .mockResolvedValue(undefined);

    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });

    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 2,
            reminder_key: "key-done",
            note_path: "Vault/Work.md",
            line: 20,
            due_at_utc: "2026-10-26T12:00:00Z",
            text: "Finish unit tests",
          },
        ],
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
    });

    expect(markDoneSpy).toHaveBeenCalledWith(
      "Vault/Work.md",
      {
        line: 20,
        text: "Finish unit tests",
        dueAtUtc: "2026-10-26T12:00:00Z",
      },
      true,
    );
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("dismisses toast even if markReminderDoneInVault rejects with an error", async () => {
    vi.spyOn(reminderTaskActions, "markReminderDoneInVault").mockRejectedValue(
      new Error("File disk write error"),
    );

    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });

    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 3,
            notePath: "Broken.md",
            line: 1,
            dueAtUtc: "2026-10-26T12:00:00Z",
            text: "Broken task",
          },
        ],
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
    });
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("triggers snooze and dismisses toast when snooze preset is clicked", async () => {
    const snoozeSpy = vi
      .spyOn(reminderSnoozeActions, "snoozeReminderAction")
      .mockResolvedValue(undefined);

    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });

    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 4,
            reminder_key: "snooze-key",
            note_path: "Reminders.md",
            line: 7,
            due_at_utc: "2026-10-26T15:00:00Z",
            text: "Snooze task",
          },
        ],
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Snooze" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "10 minutes" }));
    });

    expect(snoozeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderKey: "snooze-key",
        notePath: "Reminders.md",
      }),
      expect.any(String),
    );
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("navigates to note and renders Send on WhatsApp button when whatsappClickUrl is provided", async () => {
    render(<ReminderNotificationToast onSelectNote={onSelectNoteMock} />);
    await waitFor(() => {
      expect(listeners["davinci-reminders-due"]).toBeDefined();
    });
    await act(async () => {
      listeners["davinci-reminders-due"]?.({
        payload: [
          {
            id: 6,
            note_path: "Notes/WhatsApp.md",
            line: 3,
            due_at_utc: "2026-10-26T18:00:00Z",
            text: "Confirm flight",
            whatsapp_click_url: "https://wa.me/14155550199?text=Confirm%20flight",
          },
        ],
      });
    });
    expect(
      screen.getByRole("button", { name: /Send on WhatsApp/i }),
    ).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Notes\/WhatsApp\.md/ }));
    });
    expect(onSelectNoteMock).toHaveBeenCalledWith("Notes/WhatsApp.md", 3);
  });
});
