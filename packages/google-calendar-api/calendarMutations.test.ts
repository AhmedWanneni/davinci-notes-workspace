import { describe, it, expect, vi } from "vitest";
import {
  GoogleCalendarClient,
  GooglePreconditionFailedError,
  GoogleAuthExpiredError,
} from "./calendarClient";

describe("GoogleCalendarClient Two-Way Mutations & ETag Handling", () => {
  it("getEvent fetches single event and normalizes etag", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-get-1",
        etag: '"remote-etag-1"',
        summary: "Fetched Event",
        start: { dateTime: "2026-10-27T10:00:00Z" },
        end: { dateTime: "2026-10-27T11:00:00Z" },
        status: "confirmed",
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const evt = await client.getEvent("mock-token", "primary", "evt-get-1");

    expect(evt.id).toBe("evt-get-1");
    expect(evt.etag).toBe('"remote-etag-1"');
    expect(evt.syncStatus).toBe("synced");
  });

  it("updateEvent sends If-Match header when etag is provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-123",
        etag: '"etag-v2"',
        summary: "Updated Title",
        start: { dateTime: "2026-10-27T10:00:00Z" },
        end: { dateTime: "2026-10-27T11:00:00Z" },
      }),
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    const res = await client.updateEvent(
      "mock-token",
      "primary",
      "evt-123",
      { summary: "Updated Title" },
      '"etag-v1"',
    );

    expect(res.etag).toBe('"etag-v2"');
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-123",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
          "If-Match": '"etag-v1"',
        }),
      }),
    );
  });

  it("updateEvent throws GooglePreconditionFailedError on HTTP 412", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 412,
      text: async () => "Precondition Failed",
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(
      client.updateEvent("mock-token", "primary", "evt-123", { summary: "Stale" }, '"stale-etag"'),
    ).rejects.toThrow(GooglePreconditionFailedError);
  });

  it("deleteEvent sends DELETE with If-Match header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await client.deleteEvent("mock-token", "primary", "evt-del-1", '"etag-del"');

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-del-1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
          "If-Match": '"etag-del"',
        }),
      }),
    );
  });

  it("deleteEvent succeeds silently if remote returns 404 or 410 (already deleted)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(
      client.deleteEvent("mock-token", "primary", "evt-missing"),
    ).resolves.toBeUndefined();
  });

  it("deleteEvent throws GooglePreconditionFailedError on HTTP 412", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 412,
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(
      client.deleteEvent("mock-token", "primary", "evt-conflict", '"old-etag"'),
    ).rejects.toThrow(GooglePreconditionFailedError);
  });

  it("deleteEvent throws GoogleAuthExpiredError on HTTP 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const client = new GoogleCalendarClient({ fetchFn: mockFetch });
    await expect(
      client.deleteEvent("mock-token", "primary", "evt-1"),
    ).rejects.toThrow(GoogleAuthExpiredError);
  });

  it("invokes globalThis.fetch with globalThis receiver (WKWebView Window.fetch compatibility)", async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError("Can only call Window.fetch on instances of Window");
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response);
    } as typeof fetch;

    try {
      const client = new GoogleCalendarClient();
      const calendars = await client.listCalendars("mock-token");
      expect(calendars).toEqual([]);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
