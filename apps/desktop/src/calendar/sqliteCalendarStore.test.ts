import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NormalizedCalendarEvent, CalendarListItem } from "@app/google-calendar-api";
import {
  saveCalendarsToDb,
  getCalendarsFromDb,
  updateCalendarSelectedInDb,
  saveEventsToDb,
  getEventsFromDb,
  saveCalendarSyncToken,
  getCalendarSyncToken,
  purgeCalendarCache,
} from "./sqliteCalendarStore";

interface MockDb {
  execute: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}

let mockDb: MockDb;

vi.mock("../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn(async () => mockDb),
  withDbLock: vi.fn(async <T>(fn: () => Promise<T>): Promise<T> => fn()),
  withDbTransaction: vi.fn(async (_db: unknown, fn: () => Promise<unknown>) => fn()),
}));

describe("sqliteCalendarStore", () => {
  beforeEach(() => {
    mockDb = {
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      select: vi.fn().mockResolvedValue([]),
    };
  });

  describe("Calendars CRUD", () => {
    it("saves and retrieves calendar list items", async () => {
      const calendars: CalendarListItem[] = [
        { id: "cal-1", summary: "Work", primary: true, backgroundColor: "#4285F4", selected: true },
        { id: "cal-2", summary: "Personal", primary: false, backgroundColor: "#0F9D58", selected: false },
      ];

      await saveCalendarsToDb(calendars);
      expect(mockDb.execute).toHaveBeenCalledTimes(2);

      mockDb.select.mockResolvedValueOnce([
        { id: "cal-1", summary: "Work", is_primary: 1, color: "#4285F4", selected: 1 },
        { id: "cal-2", summary: "Personal", is_primary: 0, color: "#0F9D58", selected: 0 },
      ]);

      const loaded = await getCalendarsFromDb();
      expect(loaded).toHaveLength(2);
      expect(loaded[0].primary).toBe(true);
      expect(loaded[1].selected).toBe(false);
    });

    it("updates calendar selected state in db", async () => {
      await updateCalendarSelectedInDb("cal-2", true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE google_calendars SET selected = $1 WHERE id = $2"),
        [1, "cal-2"],
      );
    });
  });

  describe("Events CRUD & Two-Way Schema Columns", () => {
    it("saves events including etag, recurrence, and sync_status", async () => {
      const event: NormalizedCalendarEvent = {
        id: "evt-123",
        calendarId: "cal-1",
        title: "Sprint Planning",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [{ email: "team@example.com", responseStatus: "accepted" }],
        updatedAt: 1729851000000,
        etag: '"etag-12345"',
        recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=TU",
        recurringEventId: "rec-master-1",
        originalStartIso: "2026-10-27T10:00:00Z",
        syncStatus: "synced",
      };

      await saveEventsToDb([event]);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO google_calendar_events"),
        expect.arrayContaining([
          "evt-123",
          "cal-1",
          "Sprint Planning",
          '"etag-12345"',
          "RRULE:FREQ=WEEKLY;BYDAY=TU",
          "rec-master-1",
          "synced",
        ]),
      );
    });

    it("deletes cancelled events on sync", async () => {
      const cancelled: NormalizedCalendarEvent = {
        id: "evt-cancelled-1",
        calendarId: "cal-1",
        title: "Cancelled Call",
        startIso: "2026-10-27T10:00:00Z",
        endIso: "2026-10-27T11:00:00Z",
        isAllDay: false,
        status: "cancelled",
        attendees: [],
        updatedAt: 1729851000000,
      };

      await saveEventsToDb([cancelled]);
      expect(mockDb.execute).toHaveBeenCalledWith(
        "DELETE FROM google_calendar_events WHERE id = $1",
        ["evt-cancelled-1"],
      );
    });

    it("retrieves events with etag and syncStatus mapped", async () => {
      mockDb.select.mockResolvedValueOnce([
        {
          id: "evt-1",
          calendar_id: "cal-1",
          title: "Architecture Review",
          start_iso: "2026-10-27T14:00:00Z",
          end_iso: "2026-10-27T15:00:00Z",
          is_all_day: 0,
          meet_url: "https://meet.google.com/abc",
          location: "Virtual",
          description: "Review plan",
          status: "confirmed",
          attendees_json: JSON.stringify([{ email: "me@example.com", self: true, responseStatus: "accepted" }]),
          updated_at: 1729851000000,
          etag: '"etag-999"',
          recurrence_rule: null,
          recurring_event_id: null,
          original_start_iso: null,
          sync_status: "pending_update",
        },
      ]);

      const events = await getEventsFromDb();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt-1");
      expect(events[0].etag).toBe('"etag-999"');
      expect(events[0].syncStatus).toBe("pending_update");
      expect(mockDb.select).toHaveBeenCalledWith(
        expect.stringContaining("LEFT JOIN google_calendars c ON e.calendar_id = c.id"),
        [],
      );
    });
  });

  describe("Sync Token Lifecycle", () => {
    it("saves and retrieves sync tokens", async () => {
      await saveCalendarSyncToken("cal-1", "token-xyz");
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO google_calendar_sync_state"),
        expect.arrayContaining(["cal-1", "token-xyz"]),
      );

      mockDb.select.mockResolvedValueOnce([{ sync_token: "token-xyz" }]);
      const token = await getCalendarSyncToken("cal-1");
      expect(token).toBe("token-xyz");
    });
  });

  describe("Purge on Disconnect", () => {
    it("purges all 4 calendar tables in a single transaction", async () => {
      await purgeCalendarCache();
      expect(mockDb.execute).toHaveBeenCalledWith("DELETE FROM google_calendar_events;");
      expect(mockDb.execute).toHaveBeenCalledWith("DELETE FROM google_calendars;");
      expect(mockDb.execute).toHaveBeenCalledWith("DELETE FROM google_calendar_sync_state;");
      expect(mockDb.execute).toHaveBeenCalledWith("DELETE FROM google_calendar_outbox;");
    });
  });
});
