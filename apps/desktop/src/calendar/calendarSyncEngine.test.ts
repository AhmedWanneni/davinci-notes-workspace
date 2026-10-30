import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GoogleAuthExpiredError,
  GoogleCalendarClient,
  GoogleSyncTokenExpiredError,
  type CalendarListItem,
  type NormalizedCalendarEvent,
} from "@app/google-calendar-api";
import { CalendarSyncEngine } from "./calendarSyncEngine";
import * as store from "./sqliteCalendarStore";

vi.mock("./sqliteCalendarStore", () => {
  let calendars: CalendarListItem[] = [];
  let events: NormalizedCalendarEvent[] = [];
  const syncTokens = new Map<string, string>();

  return {
    saveCalendarsToDb: vi.fn(async (cals: CalendarListItem[]) => {
      calendars = [...cals];
    }),
    getCalendarsFromDb: vi.fn(async () => calendars),
    updateCalendarSelectedInDb: vi.fn(async (id: string, sel: boolean) => {
      const found = calendars.find((c) => c.id === id);
      if (found) found.selected = sel;
    }),
    saveEventsToDb: vi.fn(async (evts: NormalizedCalendarEvent[]) => {
      for (const e of evts) {
        if (e.status === "cancelled") {
          events = events.filter((x) => x.id !== e.id);
        } else {
          const idx = events.findIndex((x) => x.id === e.id);
          if (idx >= 0) events[idx] = e;
          else events.push(e);
        }
      }
    }),
    getEventsFromDb: vi.fn(async () => events),
    getCalendarSyncToken: vi.fn(async (id: string) => syncTokens.get(id) ?? null),
    saveCalendarSyncToken: vi.fn(async (id: string, token: string) => {
      syncTokens.set(id, token);
    }),
    purgeCalendarCache: vi.fn(async () => {
      calendars = [];
      events = [];
      syncTokens.clear();
    }),
  };
});

describe("CalendarSyncEngine", () => {
  let mockClient: GoogleCalendarClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new GoogleCalendarClient();
  });

  it("syncNow fetches calendars, queries selected calendars, and updates store", async () => {
    vi.spyOn(mockClient, "listCalendars").mockResolvedValue([
      { id: "primary", summary: "Personal", primary: true, selected: true },
      { id: "work@company.com", summary: "Work", primary: false, selected: true },
    ]);

    vi.spyOn(mockClient, "listEvents").mockImplementation(async (_token, calId) => {
      if (calId === "primary") {
        return {
          events: [
            {
              id: "evt-1",
              calendarId: "primary",
              title: "Meeting 1",
              startIso: "2026-10-20T10:00:00Z",
              endIso: "2026-10-20T11:00:00Z",
              isAllDay: false,
              status: "confirmed",
              attendees: [],
              updatedAt: Date.now(),
            },
          ],
          nextSyncToken: "token-prim-1",
        };
      }
      return {
        events: [],
        nextSyncToken: "token-work-1",
      };
    });

    const onComplete = vi.fn();
    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "valid-token",
      onSyncComplete: onComplete,
    });

    const result = await engine.syncNow();
    expect(result.success).toBe(true);
    expect(result.eventCount).toBe(1);
    expect(store.saveCalendarsToDb).toHaveBeenCalled();
    expect(store.saveEventsToDb).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "evt-1" })]),
    );
    expect(store.saveCalendarSyncToken).toHaveBeenCalledWith("primary", "token-prim-1");
    expect(onComplete).toHaveBeenCalledWith(1);
  });

  it("syncNow recovers from GoogleSyncTokenExpiredError via full sync", async () => {
    vi.spyOn(mockClient, "listCalendars").mockResolvedValue([
      { id: "primary", summary: "Personal", primary: true, selected: true },
    ]);

    vi.mocked(store.getCalendarSyncToken).mockResolvedValueOnce("stale-sync-token");

    let callCount = 0;
    vi.spyOn(mockClient, "listEvents").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new GoogleSyncTokenExpiredError();
      }
      return {
        events: [
          {
            id: "evt-recovered",
            calendarId: "primary",
            title: "Recovered Meeting",
            startIso: "2026-10-21T09:00:00Z",
            endIso: "2026-10-21T10:00:00Z",
            isAllDay: false,
            status: "confirmed",
            attendees: [],
            updatedAt: Date.now(),
          },
        ],
        nextSyncToken: "fresh-sync-token",
      };
    });

    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "valid-token",
    });

    const result = await engine.syncNow();
    expect(result.success).toBe(true);
    expect(result.eventCount).toBe(1);
    expect(callCount).toBe(2);
    expect(store.saveCalendarSyncToken).toHaveBeenCalledWith("primary", "fresh-sync-token");
  });

  it("syncNow handles GoogleAuthExpiredError cleanly", async () => {
    vi.spyOn(mockClient, "listCalendars").mockRejectedValue(new GoogleAuthExpiredError());

    const onError = vi.fn();
    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "expired-token",
      onError,
    });

    const result = await engine.syncNow();
    expect(result.success).toBe(false);
    expect(result.error).toBe("auth-expired");
    expect(onError).toHaveBeenCalledWith(expect.any(GoogleAuthExpiredError));
  });

  it("syncDateRange fetches visible window with singleEvents=true", async () => {
    vi.mocked(store.getCalendarsFromDb).mockResolvedValueOnce([
      { id: "primary", summary: "Personal", primary: true, selected: true },
    ]);

    const listSpy = vi.spyOn(mockClient, "listEvents").mockResolvedValue({
      events: [
        {
          id: "evt-range-1",
          calendarId: "primary",
          title: "Range Event",
          startIso: "2026-11-05T10:00:00Z",
          endIso: "2026-11-05T11:00:00Z",
          isAllDay: false,
          status: "confirmed",
          attendees: [],
          updatedAt: Date.now(),
        },
      ],
    });

    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "valid-token",
    });

    const res = await engine.syncDateRange("2026-11-01T00:00:00Z", "2026-11-30T23:59:59Z");
    expect(res.success).toBe(true);
    expect(res.eventCount).toBe(1);
    expect(listSpy).toHaveBeenCalledWith("valid-token", "primary", {
      timeMin: "2026-11-01T00:00:00Z",
      timeMax: "2026-11-30T23:59:59Z",
      singleEvents: true,
      orderBy: "startTime",
    });
    expect(store.saveEventsToDb).toHaveBeenCalled();
  });
});
