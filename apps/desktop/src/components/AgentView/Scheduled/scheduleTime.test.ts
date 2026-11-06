import { describe, expect, it } from "vitest";
import {
  describeNextRun,
  describeRecurrence,
  formatClockTime,
  toLocalSpec,
  toUtcRecurrence,
  type LocalScheduleSpec,
} from "./scheduleTime";

const spec = (p: Partial<LocalScheduleSpec>): LocalScheduleSpec => ({
  frequency: "daily",
  time: "08:00",
  dayOfWeek: 1,
  intervalHours: 24,
  ...p,
});

describe("scheduleTime", () => {
  it("round-trips daily local time through UTC", () => {
    const rec = toUtcRecurrence(spec({ time: "08:30" }));
    expect(rec.type).toBe("daily");
    expect(toLocalSpec(rec).time).toBe("08:30");
  });

  it("round-trips weekly day + time even across a UTC day boundary", () => {
    for (const time of ["00:15", "12:00", "23:45"]) {
      const rec = toUtcRecurrence(spec({ frequency: "weekly", dayOfWeek: 5, time }));
      const back = toLocalSpec(rec);
      expect(back.dayOfWeek).toBe(5);
      expect(back.time).toBe(time);
    }
  });

  it("keeps interval hours as-is", () => {
    expect(toUtcRecurrence(spec({ frequency: "interval", intervalHours: 6 }))).toEqual({
      type: "interval",
      intervalHours: 6,
    });
  });

  it("formats 12-hour clock times", () => {
    expect(formatClockTime("00:05")).toBe("12:05 AM");
    expect(formatClockTime("08:00")).toBe("8:00 AM");
    expect(formatClockTime("19:30")).toBe("7:30 PM");
  });

  it("describes recurrences in plain language", () => {
    expect(describeRecurrence(toUtcRecurrence(spec({ time: "08:00" })))).toBe(
      "Every day at 8:00 AM",
    );
    expect(
      describeRecurrence(toUtcRecurrence(spec({ frequency: "weekly", dayOfWeek: 5, time: "19:00" }))),
    ).toBe("Every Friday at 7:00 PM");
    expect(describeRecurrence({ type: "interval", intervalHours: 720 })).toBe("Every 30 days");
    expect(describeRecurrence({ type: "interval", intervalHours: 1 })).toBe("Every hour");
  });

  it("labels the next run relative to today", () => {
    const now = new Date(2026, 10, 4, 19, 0);
    expect(describeNextRun(new Date(2026, 10, 4, 21, 0).toISOString(), now)).toBe("Today 9:00 PM");
    expect(describeNextRun(new Date(2026, 10, 5, 8, 0).toISOString(), now)).toBe("Tomorrow 8:00 AM");
  });
});
