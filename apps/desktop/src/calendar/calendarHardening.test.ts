import {
  GoogleCalendarClient,
  GoogleSyncTokenExpiredError,
  GoogleAuthExpiredError,
  type NormalizedCalendarEvent,
} from "@app/google-calendar-api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarSyncEngine } from "./calendarSyncEngine";
import * as store from "./sqliteCalendarStore";
import { isEventNoteMatch, generateMeetingNoteMarkdown } from "./meetingNoteGenerator";

vi.mock("./sqliteCalendarStore", () => ({
  getCalendarsFromDb: vi.fn(),
  getCalendarSyncToken: vi.fn(),
  saveCalendarSyncToken: vi.fn(),
  saveEventsToDb: vi.fn(),
  getEventsFromDb: vi.fn(),
  purgeCalendarCache: vi.fn(),
  saveCalendarsToDb: vi.fn(),
}));

const mockCalendar = {
  id: "primary",
  summary: "Primary Work",
  selected: true,
  primary: true,
};

const mockEvent: NormalizedCalendarEvent = {
  id: "evt-hardening-1",
  calendarId: "primary",
  title: "Late Night Strategy Sync",
  startIso: "2026-10-20T23:30:00.000Z",
  endIso: "2026-10-21T00:30:00.000Z",
  isAllDay: false,
  meetUrl: "https://meet.google.com/strat-sync",
  location: "Online",
  status: "confirmed",
  attendees: [{ displayName: "Lead Dev", email: "lead@example.com" }],
  updatedAt: 1729467000000,
};

describe("Calendar Hardening & Resiliency", () => {
  let mockClient: GoogleCalendarClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new GoogleCalendarClient();
  });

  it("handles offline network failure without corrupting SQLite cache", async () => {
    vi.spyOn(mockClient, "listCalendars").mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    const onError = vi.fn();
    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "token-123",
      onError,
    });

    const res = await engine.syncNow();
    expect(res.success).toBe(false);
    expect(res.error).toBe("Failed to fetch");
    expect(onError).toHaveBeenCalled();

    // Cache should remain untouched, no events saved
    expect(store.saveEventsToDb).not.toHaveBeenCalled();
    expect(store.purgeCalendarCache).not.toHaveBeenCalled();
  });

  it("recovers from 410 Gone syncToken expiration via automatic full re-sync", async () => {
    vi.spyOn(mockClient, "listCalendars").mockResolvedValue([mockCalendar]);
    vi.mocked(store.getCalendarsFromDb).mockResolvedValue([mockCalendar]);
    vi.mocked(store.getCalendarSyncToken).mockResolvedValue("expired-token");

    // First call throws 410, second full-fetch call succeeds
    vi.spyOn(mockClient, "listEvents")
      .mockRejectedValueOnce(new GoogleSyncTokenExpiredError("primary"))
      .mockResolvedValueOnce({
        events: [mockEvent],
        nextSyncToken: "fresh-new-token",
      });

    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "token-123",
    });

    const res = await engine.syncNow();
    expect(res.success).toBe(true);
    expect(store.saveCalendarSyncToken).toHaveBeenCalledWith(
      "primary",
      "fresh-new-token",
    );
    expect(store.saveEventsToDb).toHaveBeenCalledWith([mockEvent]);
  });

  it("surfaces GoogleAuthExpiredError (401) cleanly to trigger re-auth flow", async () => {
    vi.spyOn(mockClient, "listCalendars").mockRejectedValue(
      new GoogleAuthExpiredError(),
    );

    const onError = vi.fn();
    const engine = new CalendarSyncEngine({
      client: mockClient,
      getAccessToken: async () => "expired-auth-token",
      onError,
    });

    const res = await engine.syncNow();
    expect(res.success).toBe(false);
    expect(res.error).toContain("expired");
    expect(onError).toHaveBeenCalledWith(expect.any(GoogleAuthExpiredError));
  });

  it("correctly preserves timezone-aware UTC ISO timestamps across note generation", () => {
    const md = generateMeetingNoteMarkdown(mockEvent);
    expect(md).toContain('calendar_event_id: "evt-hardening-1"');
    expect(isEventNoteMatch(md, "evt-hardening-1")).toBe(true);
    expect(md).toContain("Late Night Strategy Sync");
    expect(md).toContain("https://meet.google.com/strat-sync");
  });

  it("formats all-day events without time component shifts", () => {
    const allDayEvent: NormalizedCalendarEvent = {
      ...mockEvent,
      id: "all-day-conf",
      title: "Company Offsite",
      startIso: "2026-10-25",
      endIso: "2026-10-26",
      isAllDay: true,
    };

    const md = generateMeetingNoteMarkdown(allDayEvent);
    expect(md).toContain('time: "All day"');
    expect(md).toContain("Company Offsite");
  });
});
