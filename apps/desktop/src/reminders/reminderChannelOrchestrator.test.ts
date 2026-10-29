import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchReminderChannels, type DueReminderItem } from "./reminderChannelOrchestrator";
import * as dispatcher from "../notifications/notifyDispatcher";
import * as queries from "../vault/remindersViewQueries";
import type Database from "@tauri-apps/plugin-sql";

vi.mock("../notifications/notifyDispatcher", () => ({
  notify: vi.fn(),
}));

vi.mock("../vault/remindersViewQueries", () => ({
  getIndexDb: vi.fn(),
  upsertReminderChannelState: vi.fn(),
}));

describe("reminderChannelOrchestrator", () => {
  const mockDb = {
    select: vi.fn(),
    execute: vi.fn(),
  } as unknown as Database;

  const mockItem: DueReminderItem = {
    reminderKey: "test-reminder-key",
    notePath: "Notes/Daily.md",
    dueAtUtc: "2026-10-28T12:00:00.000Z",
    text: "Sync with marketing",
    line: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches to configured channels from DB", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([
      { channels_json: JSON.stringify(["telegram", "slack"]) },
    ]);
    vi.mocked(dispatcher.notify).mockResolvedValue({
      ok: true,
      status: "sent",
      success: true,
    });

    const res = await dispatchReminderChannels(mockDb, mockItem);

    expect(res.success).toBe(true);
    expect(dispatcher.notify).toHaveBeenCalledWith("telegram", expect.objectContaining({
      body: "Sync with marketing",
    }));
    expect(dispatcher.notify).toHaveBeenCalledWith("slack", expect.objectContaining({
      body: "Sync with marketing",
    }));
  });

  it("captures delivery error and persists to reminder_local_state", async () => {
    const errorItem: DueReminderItem = {
      ...mockItem,
      reminderKey: "error-key",
    };
    vi.mocked(mockDb.select).mockResolvedValueOnce([
      { channels_json: JSON.stringify(["telegram"]) },
    ]);
    vi.mocked(dispatcher.notify).mockResolvedValueOnce({
      ok: false,
      status: "failed",
      success: false,
      error: "401 Unauthorized token",
    });

    const res = await dispatchReminderChannels(mockDb, errorItem);

    expect(res.success).toBe(false);
    expect(res.errors).toContain("telegram: 401 Unauthorized token");
    expect(queries.upsertReminderChannelState).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        reminderKey: "error-key",
        deliveryError: "telegram: 401 Unauthorized token",
      }),
    );
  });
});
