import { describe, it, expect } from "vitest";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import {
  adjustGoogleAllDayEnd,
  toGoogleAllDayEnd,
  toScheduleXEvent,
  toScheduleXEvents,
  formatLocalScheduleXDateTime,
} from "./scheduleXAdapter";

describe("scheduleXAdapter", () => {
  it("formats ISO string to local YYYY-MM-DD HH:mm", () => {
    const fixed = new Date(2026, 9, 27, 14, 30); // Oct 27, 2026 14:30
    const iso = fixed.toISOString();
    const formatted = formatLocalScheduleXDateTime(iso);
    expect(formatted).toBe("2026-10-27 14:30");
  });

  describe("adjustGoogleAllDayEnd", () => {
    it("subtracts 1 day for multi-day exclusive end", () => {
      // Event spanning Oct 27 to Oct 29 (exclusive end Oct 30)
      const adjusted = adjustGoogleAllDayEnd("2026-10-27", "2026-10-30");
      expect(adjusted).toBe("2026-10-29");
    });

    it("subtracts 1 day for single-day exclusive end (end = start + 1)", () => {
      // Single-day all-day event on Oct 27 has Google end Oct 28
      const adjusted = adjustGoogleAllDayEnd("2026-10-27", "2026-10-28");
      expect(adjusted).toBe("2026-10-27");
    });

    it("returns start date if end <= start", () => {
      const adjusted = adjustGoogleAllDayEnd("2026-10-27", "2026-10-27");
      expect(adjusted).toBe("2026-10-27");
    });
  });

  describe("toGoogleAllDayEnd", () => {
    it("adds 1 day for Google exclusive end date format", () => {
      const googleEnd = toGoogleAllDayEnd("2026-10-27");
      expect(googleEnd).toBe("2026-10-28");
    });
  });

  describe("toScheduleXEvent", () => {
    it("converts all-day event correctly", () => {
      const raw: NormalizedCalendarEvent = {
        id: "evt-allday-1",
        calendarId: "primary",
        title: "Company Holiday",
        startIso: "2026-12-25",
        endIso: "2026-12-26", // Google exclusive end
        isAllDay: true,
        status: "confirmed",
        attendees: [],
        updatedAt: 1729851000000,
      };

      const result = toScheduleXEvent(raw);
      expect(result.id).toBe("evt-allday-1");
      expect(result.title).toBe("Company Holiday");
      expect(result.start).toBe("2026-12-25");
      expect(result.end).toBe("2026-12-25"); // Adjusted to inclusive
    });

    it("converts timed event correctly", () => {
      const d1 = new Date(2026, 9, 27, 9, 0).toISOString();
      const d2 = new Date(2026, 9, 27, 10, 0).toISOString();

      const raw: NormalizedCalendarEvent = {
        id: "evt-timed-1",
        calendarId: "cal-work",
        title: "Team Standup",
        startIso: d1,
        endIso: d2,
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: 1729851000000,
        description: "Daily sync",
        location: "Room 101",
      };

      const result = toScheduleXEvent(raw);
      expect(result.id).toBe("evt-timed-1");
      expect(result.start).toBe("2026-10-27 09:00");
      expect(result.end).toBe("2026-10-27 10:00");
      expect(result.description).toBe("Daily sync");
      expect(result.location).toBe("Room 101");
    });

    it("batch converts multiple events", () => {
      const list: NormalizedCalendarEvent[] = [
        {
          id: "1",
          calendarId: "cal",
          title: "A",
          startIso: "2026-10-27",
          endIso: "2026-10-28",
          isAllDay: true,
          status: "confirmed",
          attendees: [],
          updatedAt: 1,
        },
      ];
      const results = toScheduleXEvents(list);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("A");
    });
  });
});
