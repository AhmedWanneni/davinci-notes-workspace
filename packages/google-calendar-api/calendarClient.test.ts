import { describe, expect, it, vi } from "vitest";
import {
  GoogleAuthExpiredError,
  GoogleCalendarApiError,
  GoogleCalendarClient,
  GoogleSyncTokenExpiredError,
} from "./calendarClient";

describe("GoogleCalendarClient", () => {
  it("listCalendars returns normalized list of calendars", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: "primary-user@gmail.com",
            summary: "My Work Calendar",
            primary: true,
            backgroundColor: "#ffffff",
          },
          {
            id: "family123@group.calendar.google.com",
            summary: "Family",
            primary: false,
          },
        ],
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const calendars = await client.listCalendars("mock-token");

    expect(calendars).toHaveLength(2);
    expect(calendars[0]).toEqual({
      id: "primary-user@gmail.com",
      summary: "My Work Calendar",
      primary: true,
      description: undefined,
      backgroundColor: "#ffffff",
      foregroundColor: undefined,
      selected: true,
    });
    expect(calendars[1].primary).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
      }),
    );
  });

  it("listCalendars throws GoogleAuthExpiredError on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(client.listCalendars("bad-token")).rejects.toThrow(
      GoogleAuthExpiredError,
    );
  });

  it("listEvents normalizes events and extracts Meet links", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: "evt-timed",
            summary: "Sprint Planning",
            start: { dateTime: "2026-10-20T10:00:00Z" },
            end: { dateTime: "2026-10-20T11:00:00Z" },
            hangoutLink: "https://meet.google.com/xyz-uvwx-rst",
            status: "confirmed",
            attendees: [{ email: "dev@davinci.app", self: true }],
          },
          {
            id: "evt-allday",
            summary: "Public Holiday",
            start: { date: "2026-10-25" },
            end: { date: "2026-10-26" },
            status: "confirmed",
          },
        ],
        nextSyncToken: "sync-token-999",
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const result = await client.listEvents("mock-token", "primary", {
      timeMin: "2026-10-20T00:00:00Z",
    });

    expect(result.events).toHaveLength(2);
    expect(result.nextSyncToken).toBe("sync-token-999");

    const timed = result.events[0];
    expect(timed.id).toBe("evt-timed");
    expect(timed.calendarId).toBe("primary");
    expect(timed.isAllDay).toBe(false);
    expect(timed.meetUrl).toBe("https://meet.google.com/xyz-uvwx-rst");
    expect(timed.attendees).toHaveLength(1);

    const allDay = result.events[1];
    expect(allDay.id).toBe("evt-allday");
    expect(allDay.isAllDay).toBe(true);
    expect(allDay.startIso).toBe("2026-10-25");
  });

  it("listEvents throws GoogleSyncTokenExpiredError on 410 Gone", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
      text: async () => "Sync token is no longer valid",
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(
      client.listEvents("mock-token", "primary", { syncToken: "expired-token" }),
    ).rejects.toThrow(GoogleSyncTokenExpiredError);
  });

  it("listEvents passes syncToken without timeMin/timeMax", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await client.listEvents("mock-token", "primary", {
      syncToken: "valid-sync-token",
    });

    const calledUrl = (mockFetch.mock.calls[0] as [string])[0];
    expect(calledUrl).toContain("syncToken=valid-sync-token");
    expect(calledUrl).not.toContain("timeMin");
  });

  it("throws GoogleCalendarApiError on other HTTP errors", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Quota exceeded",
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(client.listCalendars("mock-token")).rejects.toThrow(
      GoogleCalendarApiError,
    );
  });

  it("createEvent sends POST and returns normalized created event", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "created-evt-1",
        summary: "Weekly Planning",
        start: { dateTime: "2026-10-26T09:00:00Z" },
        end: { dateTime: "2026-10-26T10:00:00Z" },
        status: "confirmed",
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const res = await client.createEvent("mock-token", "primary", {
      summary: "Weekly Planning",
      start: { dateTime: "2026-10-26T09:00:00Z" },
      end: { dateTime: "2026-10-26T10:00:00Z" },
    });

    expect(res.id).toBe("created-evt-1");
    expect(res.title).toBe("Weekly Planning");
    expect(res.startIso).toBe("2026-10-26T09:00:00Z");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
        body: JSON.stringify({
          summary: "Weekly Planning",
          start: { dateTime: "2026-10-26T09:00:00Z" },
          end: { dateTime: "2026-10-26T10:00:00Z" },
        }),
      }),
    );
  });

  it("updateEvent sends PATCH and returns updated event", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-123",
        summary: "Updated Title",
        start: { dateTime: "2026-10-26T14:00:00Z" },
        end: { dateTime: "2026-10-26T15:00:00Z" },
        status: "confirmed",
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const res = await client.updateEvent("mock-token", "primary", "evt-123", {
      summary: "Updated Title",
    });

    expect(res.id).toBe("evt-123");
    expect(res.title).toBe("Updated Title");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-123",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
      }),
    );
  });
});
