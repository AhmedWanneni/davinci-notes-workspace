import { describe, expect, it } from "vitest";
import {
  extractConferenceUrl,
  hasConferenceUrl,
  isEventImminentOrActive,
  findActiveMeetingCandidate,
} from "./meetingDetector";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

describe("meetingDetector", () => {
  const baseEvent: NormalizedCalendarEvent = {
    id: "evt-123",
    calendarId: "primary",
    title: "Sprint Planning",
    startIso: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // starts in 2 mins
    endIso: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    isAllDay: false,
    status: "confirmed",
  };

  it("extracts direct meetUrl", () => {
    const evt: NormalizedCalendarEvent = {
      ...baseEvent,
      meetUrl: "https://meet.google.com/abc-defg-hij",
    };
    expect(hasConferenceUrl(evt)).toBe(true);
    expect(extractConferenceUrl(evt)).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("extracts zoom link from location or description", () => {
    const evt: NormalizedCalendarEvent = {
      ...baseEvent,
      description: "Join Zoom: https://zoom.us/j/123456789 with password",
    };
    expect(hasConferenceUrl(evt)).toBe(true);
    expect(extractConferenceUrl(evt)).toContain("https://zoom.us/j/123456789");
  });

  it("identifies imminent event starting within 5 minutes", () => {
    expect(isEventImminentOrActive(baseEvent)).toBe(true);
  });

  it("identifies active ongoing event", () => {
    const ongoing: NormalizedCalendarEvent = {
      ...baseEvent,
      startIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      endIso: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    };
    expect(isEventImminentOrActive(ongoing)).toBe(true);
  });

  it("ignores cancelled or all-day events", () => {
    expect(isEventImminentOrActive({ ...baseEvent, status: "cancelled" })).toBe(
      false,
    );
    expect(isEventImminentOrActive({ ...baseEvent, isAllDay: true })).toBe(
      false,
    );
  });

  it("finds candidate event and respects dismissed set", () => {
    const evtWithMeet: NormalizedCalendarEvent = {
      ...baseEvent,
      meetUrl: "https://meet.google.com/test",
    };
    const dismissed = new Set<string>();

    const candidate = findActiveMeetingCandidate([evtWithMeet], dismissed);
    expect(candidate?.id).toBe("evt-123");

    dismissed.add("evt-123");
    const candidateDismissed = findActiveMeetingCandidate(
      [evtWithMeet],
      dismissed,
    );
    expect(candidateDismissed).toBeNull();
  });
});
