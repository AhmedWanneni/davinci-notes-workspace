import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GoogleCalendarClient,
  GooglePreconditionFailedError,
  type NormalizedCalendarEvent,
} from "@app/google-calendar-api";
import {
  CalendarOutboxWorker,
  optimisticCreateEvent,
  optimisticUpdateEvent,
  optimisticDeleteEvent,
} from "./calendarOutboxWorker";
import * as store from "./sqliteCalendarStore";
import * as outboxStore from "./sqliteCalendarOutboxStore";

vi.mock("./sqliteCalendarStore", () => ({
  saveEventsToDb: vi.fn().mockResolvedValue(undefined),
  deleteEventFromDb: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./sqliteCalendarOutboxStore", () => ({
  enqueueOutboxMutation: vi.fn().mockResolvedValue({ id: "outbox_1" }),
  getPendingOutboxItems: vi.fn().mockResolvedValue([]),
  removeOutboxItem: vi.fn().mockResolvedValue(undefined),
  updateOutboxItemError: vi.fn().mockResolvedValue(undefined),
  markEventSyncStatus: vi.fn().mockResolvedValue(undefined),
}));

describe("calendarOutboxWorker", () => {
  let mockClient: GoogleCalendarClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new GoogleCalendarClient();
  });

  describe("Optimistic Local Mutations", () => {
    it("optimisticCreateEvent saves pending_create event and enqueues outbox item", async () => {
      const evt = await optimisticCreateEvent("primary", {
        summary: "Design Sync",
        start: { dateTime: "2026-10-27T10:00:00Z" },
        end: { dateTime: "2026-10-27T11:00:00Z" },
      });

      expect(evt.id).toMatch(/^temp_/);
      expect(evt.syncStatus).toBe("pending_create");
      expect(store.saveEventsToDb).toHaveBeenCalledWith([evt]);
      expect(outboxStore.enqueueOutboxMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "create",
          calendarId: "primary",
          eventId: evt.id,
        }),
      );
    });

    it("optimisticUpdateEvent saves pending_update event and enqueues outbox with etag", async () => {
      const existing: NormalizedCalendarEvent = {
        id: "evt-1",
        calendarId: "primary",
        title: "Old Title",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: 1000,
        etag: '"etag-v1"',
      };

      const updated = await optimisticUpdateEvent(existing, { summary: "New Title" });
      expect(updated.title).toBe("New Title");
      expect(updated.syncStatus).toBe("pending_update");
      expect(outboxStore.enqueueOutboxMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update",
          eventId: "evt-1",
          etag: '"etag-v1"',
        }),
      );
    });

    it("optimisticDeleteEvent marks pending_delete and enqueues delete action", async () => {
      const existing: NormalizedCalendarEvent = {
        id: "evt-del-1",
        calendarId: "primary",
        title: "To Delete",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: 1000,
        etag: '"etag-del"',
      };

      await optimisticDeleteEvent(existing);
      expect(outboxStore.markEventSyncStatus).toHaveBeenCalledWith("evt-del-1", "pending_delete");
      expect(outboxStore.enqueueOutboxMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "delete",
          eventId: "evt-del-1",
          etag: '"etag-del"',
        }),
      );
    });
  });

  describe("Outbox Worker Dispatch & Conflict Resolution", () => {
    it("flushes create, update, and delete mutations in FIFO order", async () => {
      vi.mocked(outboxStore.getPendingOutboxItems).mockResolvedValueOnce([
        {
          id: "outbox_1",
          clientMutationId: "m1",
          calendarId: "primary",
          eventId: "temp_123",
          action: "create",
          payloadJson: JSON.stringify({
            summary: "Created",
            start: { dateTime: "2026-10-27T10:00:00Z" },
            end: { dateTime: "2026-10-27T11:00:00Z" },
          }),
          attempts: 0,
          createdAt: 100,
          updatedAt: 100,
        },
        {
          id: "outbox_2",
          clientMutationId: "m2",
          calendarId: "primary",
          eventId: "evt-existing",
          action: "delete",
          payloadJson: "{}",
          etag: '"etag-2"',
          attempts: 0,
          createdAt: 200,
          updatedAt: 200,
        },
      ]);

      vi.spyOn(mockClient, "createEvent").mockResolvedValueOnce({
        id: "google_real_id_1",
        calendarId: "primary",
        title: "Created",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: 500,
        etag: '"etag-new"',
        syncStatus: "synced",
      });

      vi.spyOn(mockClient, "deleteEvent").mockResolvedValueOnce(undefined);

      const worker = new CalendarOutboxWorker({
        client: mockClient,
        getAccessToken: async () => "token-abc",
      });

      const res = await worker.flushOutbox();
      expect(res).toEqual({ processed: 2, conflicts: 0, failed: 0 });
      expect(store.deleteEventFromDb).toHaveBeenCalledWith("temp_123");
      expect(store.deleteEventFromDb).toHaveBeenCalledWith("evt-existing");
      expect(outboxStore.removeOutboxItem).toHaveBeenCalledWith("outbox_1");
      expect(outboxStore.removeOutboxItem).toHaveBeenCalledWith("outbox_2");
      worker.stopRetryTimer();
    });

    it("handles network failure mid-write by recording error and keeping outbox intact", async () => {
      vi.mocked(outboxStore.getPendingOutboxItems).mockResolvedValueOnce([
        {
          id: "outbox_offline",
          clientMutationId: "m-off",
          calendarId: "primary",
          eventId: "evt-1",
          action: "update",
          payloadJson: JSON.stringify({ summary: "Offline Edit" }),
          etag: '"etag-1"',
          attempts: 0,
          createdAt: 100,
          updatedAt: 100,
        },
      ]);

      vi.spyOn(mockClient, "updateEvent").mockRejectedValueOnce(new Error("Failed to fetch"));

      const onError = vi.fn();
      const worker = new CalendarOutboxWorker({
        client: mockClient,
        getAccessToken: async () => "token-abc",
        onError,
      });

      const res = await worker.flushOutbox();
      expect(res).toEqual({ processed: 0, conflicts: 0, failed: 1 });
      expect(outboxStore.updateOutboxItemError).toHaveBeenCalledWith(
        "outbox_offline",
        "Failed to fetch",
      );
      expect(outboxStore.removeOutboxItem).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      worker.stopRetryTimer();
    });

    it("resolves HTTP 412 conflict with Google-wins policy, fetching remote event and notifying user", async () => {
      vi.mocked(outboxStore.getPendingOutboxItems).mockResolvedValueOnce([
        {
          id: "outbox_conflict",
          clientMutationId: "m-conf",
          calendarId: "primary",
          eventId: "evt-conflict-1",
          action: "update",
          payloadJson: JSON.stringify({ summary: "Stale Local Edit" }),
          etag: '"stale-etag"',
          attempts: 0,
          createdAt: 100,
          updatedAt: 100,
        },
      ]);

      vi.spyOn(mockClient, "updateEvent").mockRejectedValueOnce(
        new GooglePreconditionFailedError(),
      );

      const remoteVersion: NormalizedCalendarEvent = {
        id: "evt-conflict-1",
        calendarId: "primary",
        title: "Remote Authoritative Title",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: 2000,
        etag: '"remote-fresh-etag"',
        syncStatus: "synced",
      };

      vi.spyOn(mockClient, "getEvent").mockResolvedValueOnce(remoteVersion);

      const onConflictResolved = vi.fn();
      const worker = new CalendarOutboxWorker({
        client: mockClient,
        getAccessToken: async () => "token-abc",
        onConflictResolved,
      });

      const res = await worker.flushOutbox();
      expect(res).toEqual({ processed: 0, conflicts: 1, failed: 0 });
      expect(outboxStore.removeOutboxItem).toHaveBeenCalledWith("outbox_conflict");
      expect(store.saveEventsToDb).toHaveBeenCalledWith([remoteVersion]);
      expect(onConflictResolved).toHaveBeenCalledWith(
        remoteVersion,
        expect.stringContaining("Remote version preserved"),
      );
      worker.stopRetryTimer();
    });
  });
});
