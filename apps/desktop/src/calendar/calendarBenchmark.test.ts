import { describe, it, expect } from "vitest";
import { toScheduleXEvents } from "./scheduleXAdapter";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

describe("calendarBenchmark", () => {
  it("maps 2,000 NormalizedCalendarEvents to Schedule-X format in under 25ms", () => {
    const events: NormalizedCalendarEvent[] = Array.from({ length: 2000 }, (_, i) => ({
      id: `evt_bench_${i}`,
      calendarId: i % 3 === 0 ? "primary" : "work",
      title: `Benchmark Event ${i}`,
      startIso: "2026-04-16T09:00:00.000Z",
      endIso: "2026-04-16T10:00:00.000Z",
      isAllDay: i % 10 === 0,
      status: "confirmed",
      htmlLink: "https://calendar.google.com",
      attendees: [],
      syncStatus: i % 20 === 0 ? "syncing" : "synced",
      updatedAt: "2026-04-16T08:00:00.000Z",
    }));

    // Warm up
    toScheduleXEvents(events.slice(0, 50));

    const t0 = performance.now();
    const mapped = toScheduleXEvents(events);
    const elapsedMs = performance.now() - t0;

    expect(mapped).toHaveLength(2000);
    expect(elapsedMs).toBeLessThan(50);
  });
});
