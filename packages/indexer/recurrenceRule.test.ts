import { describe, it, expect } from "vitest";
import {
  parseRecurrenceRule,
  computeNextOccurrenceDate,
  advanceRecurringReminder,
} from "./recurrenceRule";

describe("recurrenceRule — Parsing", () => {
  it("parses shorthand frequency keywords", () => {
    expect(parseRecurrenceRule("daily")).toEqual({
      frequency: "day",
      interval: 1,
      raw: "daily",
    });
    expect(parseRecurrenceRule("/weekly")).toEqual({
      frequency: "week",
      interval: 1,
      raw: "/weekly",
    });
    expect(parseRecurrenceRule("monthly")).toEqual({
      frequency: "month",
      interval: 1,
      raw: "monthly",
    });
    expect(parseRecurrenceRule("yearly")).toEqual({
      frequency: "year",
      interval: 1,
      raw: "yearly",
    });
  });

  it("parses shorthand intervals (1d, 2w, 3m, 1y)", () => {
    expect(parseRecurrenceRule("3d")).toEqual({
      frequency: "day",
      interval: 3,
      raw: "3d",
    });
    expect(parseRecurrenceRule("2w")).toEqual({
      frequency: "week",
      interval: 2,
      raw: "2w",
    });
    expect(parseRecurrenceRule("6m")).toEqual({
      frequency: "month",
      interval: 6,
      raw: "6m",
    });
    expect(parseRecurrenceRule("2y")).toEqual({
      frequency: "year",
      interval: 2,
      raw: "2y",
    });
  });

  it("parses natural language intervals", () => {
    expect(parseRecurrenceRule("every day")).toEqual({
      frequency: "day",
      interval: 1,
      raw: "every day",
    });
    expect(parseRecurrenceRule("every 2 days")).toEqual({
      frequency: "day",
      interval: 2,
      raw: "every 2 days",
    });
    expect(parseRecurrenceRule("every 3 weeks")).toEqual({
      frequency: "week",
      interval: 3,
      raw: "every 3 weeks",
    });
    expect(parseRecurrenceRule("every month")).toEqual({
      frequency: "month",
      interval: 1,
      raw: "every month",
    });
    expect(parseRecurrenceRule("every 2 years")).toEqual({
      frequency: "year",
      interval: 2,
      raw: "every 2 years",
    });
  });

  it("parses weekly with specific weekdays", () => {
    const rule = parseRecurrenceRule("every week on monday, wednesday, friday");
    expect(rule).toEqual({
      frequency: "week",
      interval: 1,
      weekdays: ["mon", "wed", "fri"],
      raw: "every week on monday, wednesday, friday",
    });

    const rule2 = parseRecurrenceRule("weekly on tue, thu");
    expect(rule2).toEqual({
      frequency: "week",
      interval: 1,
      weekdays: ["tue", "thu"],
      raw: "weekly on tue, thu",
    });
  });

  it("parses monthly and yearly with explicit anchors", () => {
    const monthly31 = parseRecurrenceRule("every month on the 31st");
    expect(monthly31?.anchorDay).toBe(31);

    const yearlyFeb29 = parseRecurrenceRule("every year on feb 29");
    expect(yearlyFeb29?.anchorMonth).toBe(2);
    expect(yearlyFeb29?.anchorDay).toBe(29);
  });
});

describe("recurrenceRule — Verification 1: Month-end (31st) across a full year", () => {
  it("advances monthly on the 31st through all 12 months with anchor preserved", () => {
    const rule = parseRecurrenceRule("every month on 31st")!;
    let current = { year: 2026, month: 1, day: 31 }; // Jan 31, 2026

    const expectedMonths = [
      { year: 2026, month: 2, day: 28 }, // Feb (28 days in 2026)
      { year: 2026, month: 3, day: 31 }, // Mar (31 days)
      { year: 2026, month: 4, day: 30 }, // Apr (30 days)
      { year: 2026, month: 5, day: 31 }, // May (31 days)
      { year: 2026, month: 6, day: 30 }, // Jun (30 days)
      { year: 2026, month: 7, day: 31 }, // Jul (31 days)
      { year: 2026, month: 8, day: 31 }, // Aug (31 days)
      { year: 2026, month: 9, day: 30 }, // Sep (30 days)
      { year: 2026, month: 10, day: 31 }, // Oct (31 days)
      { year: 2026, month: 11, day: 30 }, // Nov (30 days)
      { year: 2026, month: 12, day: 31 }, // Dec (31 days)
      { year: 2027, month: 1, day: 31 }, // Jan 2027
    ];

    for (const expected of expectedMonths) {
      current = computeNextOccurrenceDate(current, rule, 31);
      expect(current).toEqual(expected);
    }
  });
});

describe("recurrenceRule — Verification 2: Feb 29 yearly across leap and non-leap years", () => {
  it("advances Feb 29 yearly, clamping to Feb 28 in non-leap and restoring Feb 29 in leap year", () => {
    const rule = parseRecurrenceRule("every year on feb 29")!;
    let current = { year: 2024, month: 2, day: 29 }; // Leap year 2024

    // 2025 (non-leap) -> Feb 28
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2025, month: 2, day: 28 });

    // 2026 (non-leap) -> Feb 28
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2026, month: 2, day: 28 });

    // 2027 (non-leap) -> Feb 28
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2027, month: 2, day: 28 });

    // 2028 (leap year) -> Feb 29!
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe("recurrenceRule — Verification 3: Consecutive completions", () => {
  it("completing three times in a row produces correct consecutive dates from due date", () => {
    const rule = parseRecurrenceRule("weekly")!;
    let current = { year: 2026, month: 10, day: 14 }; // Oct 14, 2026

    // 1st completion -> Oct 21
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2026, month: 10, day: 21 });

    // 2nd completion -> Oct 28
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2026, month: 10, day: 28 });

    // 3rd completion -> Nov 4
    current = computeNextOccurrenceDate(current, rule);
    expect(current).toEqual({ year: 2026, month: 11, day: 4 });
  });
});

describe("recurrenceRule — Verification 4: Weekly across a DST change", () => {
  it("preserves local wall-clock time across UK BST to GMT transition in late October", () => {
    // Oct 19, 2026 10:00 AM London (BST = UTC+1 -> 09:00 UTC)
    // Oct 26, 2026 10:00 AM London (GMT = UTC+0 -> 10:00 UTC)
    const result = advanceRecurringReminder(
      "2026-10-19",
      "10:00",
      "/weekly",
      "Europe/London",
    );

    expect(result).not.toBeNull();
    expect(result?.nextDateStr).toBe("2026-10-26");
    expect(result?.nextTimeStr).toBe("10:00");
    // Local wall clock remains 10:00 AM; UTC instant adjusts from 09:00Z to 10:00Z
    expect(result?.nextDueAtUtc).toBe("2026-10-26T10:00:00.000Z");
    expect(result?.nextTokenStr).toBe("(@2026-10-26 10:00 /weekly)");
  });
});
