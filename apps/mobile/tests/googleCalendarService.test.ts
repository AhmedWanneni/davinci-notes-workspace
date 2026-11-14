import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseEventDates,
  addReminderToGoogleCalendar,
} from "../vault/googleCalendarService";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";

vi.mock("../sync/secureTokenStore", () => ({
  defaultSecureTokenStore: {
    load: vi.fn(),
  },
}));

describe("Google Calendar Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses date string into start and end ISO strings", () => {
    const res = parseEventDates("2025-05-13 14:00");
    expect(res.startIso).toBeDefined();
    expect(res.endIso).toBeDefined();
    expect(new Date(res.endIso).getTime()).toBeGreaterThan(
      new Date(res.startIso).getTime(),
    );
  });

  it("skips sync gracefully when Google account is not authenticated", async () => {
    vi.mocked(defaultSecureTokenStore.load).mockResolvedValue(null);
    const result = await addReminderToGoogleCalendar({
      title: "Team Sync",
      dateTime: "2025-05-13 09:00",
      project: "Work",
    });

    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.error).toContain("not authenticated");
  });

  it("creates calendar event when authenticated", async () => {
    vi.mocked(defaultSecureTokenStore.load).mockResolvedValue({
      accessToken: "mock-google-token",
      refreshToken: "mock-refresh",
      expiresAt: Date.now() + 3600000,
      scope: "drive.file",
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "evt_12345",
        htmlLink: "https://calendar.google.com/event?eid=12345",
      }),
    });
    global.fetch = mockFetch;

    const result = await addReminderToGoogleCalendar({
      title: "Quarterly Planning",
      dateTime: "2025-06-01 10:00",
      project: "Work",
      notePath: "Reminders/Work.md",
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("evt_12345");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-google-token",
        }),
      }),
    );
  });
});
