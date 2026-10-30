import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enqueueOutboxMutation,
  getPendingOutboxItems,
  updateOutboxItemError,
  removeOutboxItem,
  markEventSyncStatus,
  getOutboxCount,
} from "./sqliteCalendarOutboxStore";

interface MockDb {
  execute: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}

let mockDb: MockDb;

vi.mock("../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn(async () => mockDb),
  withDbLock: vi.fn(async <T>(fn: () => Promise<T>): Promise<T> => fn()),
}));

describe("sqliteCalendarOutboxStore", () => {
  beforeEach(() => {
    mockDb = {
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      select: vi.fn().mockResolvedValue([]),
    };
  });

  it("enqueues mutation and generates unique outbox id", async () => {
    const item = await enqueueOutboxMutation({
      clientMutationId: "mut-001",
      calendarId: "primary",
      eventId: "evt-temp-1",
      action: "create",
      payloadJson: JSON.stringify({ summary: "New Meeting" }),
      etag: undefined,
    });

    expect(item.id).toMatch(/^outbox_/);
    expect(item.clientMutationId).toBe("mut-001");
    expect(item.attempts).toBe(0);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO google_calendar_outbox"),
      expect.arrayContaining([item.id, "mut-001", "primary", "evt-temp-1", "create"]),
    );
  });

  it("retrieves pending outbox items in FIFO order", async () => {
    mockDb.select.mockResolvedValueOnce([
      {
        id: "outbox_1",
        client_mutation_id: "mut-1",
        calendar_id: "cal-1",
        event_id: "evt-1",
        action: "update",
        payload_json: '{"summary":"Updated"}',
        etag: '"etag-1"',
        attempts: 0,
        last_error: null,
        created_at: 1000,
        updated_at: 1000,
      },
    ]);

    const items = await getPendingOutboxItems(10);
    expect(items).toHaveLength(1);
    expect(items[0].action).toBe("update");
    expect(items[0].etag).toBe('"etag-1"');
  });

  it("updates retry attempts and last error", async () => {
    await updateOutboxItemError("outbox_1", "Network timeout");
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SET attempts = attempts + 1, last_error = $1"),
      expect.arrayContaining(["Network timeout", expect.any(Number), "outbox_1"]),
    );
  });

  it("removes processed outbox item", async () => {
    await removeOutboxItem("outbox_1");
    expect(mockDb.execute).toHaveBeenCalledWith(
      "DELETE FROM google_calendar_outbox WHERE id = $1",
      ["outbox_1"],
    );
  });

  it("marks event sync status and updates etag", async () => {
    await markEventSyncStatus("evt-1", "synced", '"new-etag"');
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE google_calendar_events"),
      expect.arrayContaining(["synced", '"new-etag"', expect.any(Number), "evt-1"]),
    );
  });

  it("gets outbox count", async () => {
    mockDb.select.mockResolvedValueOnce([{ count: 3 }]);
    const count = await getOutboxCount();
    expect(count).toBe(3);
  });
});
