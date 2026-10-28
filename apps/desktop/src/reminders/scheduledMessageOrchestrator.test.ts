import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processDueScheduledMessages,
  computeNextDueUtc,
} from "./scheduledMessageOrchestrator";
import * as store from "./scheduledMessagesStore";
import * as dispatcher from "../notifications/notifyDispatcher";
import type Database from "@tauri-apps/plugin-sql";

vi.mock("./scheduledMessagesStore", () => ({
  listScheduledMessages: vi.fn(),
  markScheduledMessageSent: vi.fn(),
  markScheduledMessageFailed: vi.fn(),
  markScheduledMessageMissed: vi.fn(),
}));

vi.mock("../notifications/notifyDispatcher", () => ({
  notify: vi.fn(),
}));

describe("scheduledMessageOrchestrator", () => {
  const mockDb = {
    execute: vi.fn(),
  } as unknown as Database;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends due telegram message and marks sent", async () => {
    const now = Date.now();
    vi.mocked(store.listScheduledMessages).mockResolvedValueOnce([
      {
        id: "msg-1",
        channelId: "telegram",
        channelKind: "telegram",
        recipientLabel: "12345",
        messageText: "Hello world",
        dueAtUtc: new Date(now - 1000).toISOString(),
        tz: "UTC",
        localDate: "2026-10-28",
        localTime: "12:00",
        recurrenceRule: null,
        allowMentions: false,
        status: "scheduled",
        attempts: 0,
        lastError: null,
        lastSentAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    vi.mocked(dispatcher.notify).mockResolvedValueOnce({ ok: true, success: true, status: "sent" });

    await processDueScheduledMessages(mockDb, now);

    expect(dispatcher.notify).toHaveBeenCalledWith("telegram", expect.objectContaining({
      body: "Hello world",
      recipient: "12345",
    }));
    expect(store.markScheduledMessageSent).toHaveBeenCalledWith("msg-1", mockDb);
  });

  it("marks as missed if due > 5 minutes ago", async () => {
    const now = Date.now();
    const sixMinutesAgo = new Date(now - 6 * 60 * 1000).toISOString();
    vi.mocked(store.listScheduledMessages).mockResolvedValueOnce([
      {
        id: "msg-offline",
        channelId: "slack",
        channelKind: "slack",
        recipientLabel: "#team",
        messageText: "Offline check",
        dueAtUtc: sixMinutesAgo,
        tz: "UTC",
        localDate: "2026-10-28",
        localTime: "12:00",
        recurrenceRule: null,
        allowMentions: false,
        status: "scheduled",
        attempts: 0,
        lastError: null,
        lastSentAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await processDueScheduledMessages(mockDb, now);

    expect(store.markScheduledMessageMissed).toHaveBeenCalledWith("msg-offline", mockDb);
    expect(dispatcher.notify).not.toHaveBeenCalled();
  });

  it("transitions whatsapp to needs_manual_send without calling notify", async () => {
    const now = Date.now();
    vi.mocked(store.listScheduledMessages).mockResolvedValueOnce([
      {
        id: "msg-wa",
        channelId: "whatsapp-click",
        channelKind: "whatsapp-click",
        recipientLabel: "+14155552671",
        messageText: "Manual click send",
        dueAtUtc: new Date(now - 1000).toISOString(),
        tz: "UTC",
        localDate: "2026-10-28",
        localTime: "12:00",
        recurrenceRule: null,
        allowMentions: false,
        status: "scheduled",
        attempts: 0,
        lastError: null,
        lastSentAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await processDueScheduledMessages(mockDb, now);

    expect(dispatcher.notify).not.toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("needs_manual_send"),
      ["msg-wa"],
    );
  });

  it("advances due date on recurring scheduled message", () => {
    const nextUtc = computeNextDueUtc("2026-10-28T09:00:00.000Z", "daily");
    expect(nextUtc).toBe("2026-10-29T09:00:00.000Z");
  });
});
