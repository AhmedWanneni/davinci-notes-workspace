import { localToUtcIso } from "./parseReminders";

export type RecurrenceFrequency = "day" | "week" | "month" | "year";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: Weekday[];
  anchorDay?: number;
  anchorMonth?: number;
  raw: string;
}

const WEEKDAY_NAMES: Record<string, Weekday> = {
  monday: "mon",
  mon: "mon",
  tuesday: "tue",
  tue: "tue",
  wednesday: "wed",
  wed: "wed",
  thursday: "thu",
  thu: "thu",
  friday: "fri",
  fri: "fri",
  saturday: "sat",
  sat: "sat",
  sunday: "sun",
  sun: "sun",
};

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseRecurrenceRule(ruleStr: string): RecurrenceRule | null {
  const clean = ruleStr.replace(/^\/+/, "").trim().toLowerCase();
  if (!clean) return null;

  if (clean === "daily") return { frequency: "day", interval: 1, raw: ruleStr };
  if (clean === "weekly")
    return { frequency: "week", interval: 1, raw: ruleStr };
  if (clean === "monthly")
    return { frequency: "month", interval: 1, raw: ruleStr };
  if (clean === "yearly")
    return { frequency: "year", interval: 1, raw: ruleStr };

  const shortMatch = /^(\d+)([dwmy])$/.exec(clean);
  if (shortMatch) {
    const count = parseInt(shortMatch[1], 10);
    const unitMap: Record<string, RecurrenceFrequency> = {
      d: "day",
      w: "week",
      m: "month",
      y: "year",
    };
    return { frequency: unitMap[shortMatch[2]], interval: count, raw: ruleStr };
  }

  const naturalPattern =
    /^every\s+(?:(\d+)\s+)?(day|days|week|weeks|month|months|year|years)(?:\s+on\s+(.+))?$/;
  const natMatch = naturalPattern.exec(clean);
  if (natMatch) {
    const interval = natMatch[1] ? parseInt(natMatch[1], 10) : 1;
    const unit = natMatch[2].startsWith("day")
      ? "day"
      : natMatch[2].startsWith("week")
        ? "week"
        : natMatch[2].startsWith("month")
          ? "month"
          : "year";
    const onClause = natMatch[3]?.trim();
    const rule: RecurrenceRule = { frequency: unit, interval, raw: ruleStr };

    if (onClause && unit === "week") {
      const parts = onClause.split(/[\s,]+/).filter(Boolean);
      const weekdays: Weekday[] = [];
      for (const p of parts) {
        const norm = WEEKDAY_NAMES[p];
        if (norm && !weekdays.includes(norm)) weekdays.push(norm);
      }
      if (weekdays.length > 0) rule.weekdays = weekdays;
    } else if (onClause && unit === "month") {
      const dayMatch = /(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/.exec(onClause);
      if (dayMatch) rule.anchorDay = parseInt(dayMatch[1], 10);
    } else if (onClause && unit === "year") {
      if (/feb(?:ruary)?\s+29/i.test(onClause)) {
        rule.anchorMonth = 2;
        rule.anchorDay = 29;
      }
    }
    return rule;
  }

  const weeklyOnMatch = /^weekly\s+on\s+(.+)$/.exec(clean);
  if (weeklyOnMatch) {
    const parts = weeklyOnMatch[1].split(/[\s,]+/).filter(Boolean);
    const weekdays = parts
      .map((p) => WEEKDAY_NAMES[p])
      .filter(Boolean) as Weekday[];
    if (weekdays.length > 0) {
      return { frequency: "week", interval: 1, weekdays, raw: ruleStr };
    }
  }

  const monthlyOnMatch =
    /^monthly\s+on\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?$/.exec(clean);
  if (monthlyOnMatch) {
    return {
      frequency: "month",
      interval: 1,
      anchorDay: parseInt(monthlyOnMatch[1], 10),
      raw: ruleStr,
    };
  }

  return null;
}

export function computeNextOccurrenceDate(
  base: { year: number; month: number; day: number },
  rule: RecurrenceRule,
  anchorDayParam?: number,
): { year: number; month: number; day: number } {
  const anchorDay = rule.anchorDay ?? anchorDayParam ?? base.day;

  if (rule.frequency === "day") {
    const d = new Date(
      Date.UTC(base.year, base.month - 1, base.day + rule.interval),
    );
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }

  if (
    rule.frequency === "week" &&
    (!rule.weekdays || rule.weekdays.length === 0)
  ) {
    const d = new Date(
      Date.UTC(base.year, base.month - 1, base.day + rule.interval * 7),
    );
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }

  if (rule.frequency === "week" && rule.weekdays && rule.weekdays.length > 0) {
    const d = new Date(Date.UTC(base.year, base.month - 1, base.day));
    const currentDayOfWeek = d.getUTCDay();
    const targetDays = rule.weekdays
      .map((w) => WEEKDAY_INDEX[w])
      .sort((a, b) => a - b);
    const nextInSameWeek = targetDays.find((t) => t > currentDayOfWeek);

    if (nextInSameWeek !== undefined) {
      const diff = nextInSameWeek - currentDayOfWeek;
      const nextDate = new Date(
        Date.UTC(base.year, base.month - 1, base.day + diff),
      );
      return {
        year: nextDate.getUTCFullYear(),
        month: nextDate.getUTCMonth() + 1,
        day: nextDate.getUTCDate(),
      };
    }
    const daysUntilNextWeek =
      7 - currentDayOfWeek + (rule.interval - 1) * 7 + targetDays[0];
    const nextDate = new Date(
      Date.UTC(base.year, base.month - 1, base.day + daysUntilNextWeek),
    );
    return {
      year: nextDate.getUTCFullYear(),
      month: nextDate.getUTCMonth() + 1,
      day: nextDate.getUTCDate(),
    };
  }

  if (rule.frequency === "month") {
    let targetYear = base.year;
    let targetMonth = base.month + rule.interval;
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }
    const maxDays = getDaysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(anchorDay, maxDays);
    return { year: targetYear, month: targetMonth, day: targetDay };
  }

  if (rule.frequency === "year") {
    const targetYear = base.year + rule.interval;
    const targetMonth = rule.anchorMonth ?? base.month;
    const isFeb29 =
      targetMonth === 2 && (rule.anchorDay === 29 || anchorDay === 29);
    const targetDay = isFeb29
      ? isLeapYear(targetYear)
        ? 29
        : 28
      : Math.min(anchorDay, getDaysInMonth(targetYear, targetMonth));
    return { year: targetYear, month: targetMonth, day: targetDay };
  }

  return base;
}

export interface AdvancedOccurrenceResult {
  nextDateStr: string;
  nextTimeStr: string | null;
  nextDueAtUtc: string;
  nextRuleStr: string;
  nextTokenStr: string;
}

export function advanceRecurringReminder(
  dateStr: string,
  timeStr: string | null,
  recurrenceStr: string,
  timeZone = "UTC",
): AdvancedOccurrenceResult | null {
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const base = { year: parts[0], month: parts[1], day: parts[2] };

  const rule = parseRecurrenceRule(recurrenceStr);
  if (!rule) return null;

  let anchorDay = rule.anchorDay;
  if (!anchorDay) {
    if (rule.frequency === "month" && base.day === 31) {
      anchorDay = 31;
    } else if (
      rule.frequency === "year" &&
      base.month === 2 &&
      base.day === 29
    ) {
      anchorDay = 29;
    }
  }

  const next = computeNextOccurrenceDate(base, rule, anchorDay);
  const nextDateStr = `${next.year}-${String(next.month).padStart(2, "0")}-${String(next.day).padStart(2, "0")}`;

  let nextRuleStr = recurrenceStr;
  if (
    anchorDay === 31 &&
    rule.frequency === "month" &&
    !/on\s+(?:the\s+)?31/i.test(nextRuleStr)
  ) {
    nextRuleStr = `${nextRuleStr} on 31st`;
  } else if (
    anchorDay === 29 &&
    rule.frequency === "year" &&
    !/on\s+feb/i.test(nextRuleStr)
  ) {
    nextRuleStr = `${nextRuleStr} on feb 29`;
  }

  let hour = 9;
  let minute = 0;
  let second = 0;
  if (timeStr) {
    const tParts = timeStr.split(":").map((p) => parseInt(p, 10));
    if (!isNaN(tParts[0])) hour = tParts[0];
    if (!isNaN(tParts[1])) minute = tParts[1];
    if (tParts[2] && !isNaN(tParts[2])) second = tParts[2];
  }

  const nextDueAtUtc =
    localToUtcIso(
      next.year,
      next.month,
      next.day,
      hour,
      minute,
      second,
      timeZone,
    ) ??
    new Date(
      Date.UTC(next.year, next.month - 1, next.day, hour, minute, second),
    ).toISOString();

  const formattedRule = nextRuleStr.startsWith("/")
    ? nextRuleStr
    : `/${nextRuleStr}`;
  const nextTokenStr = timeStr
    ? `(@${nextDateStr} ${timeStr} ${formattedRule})`
    : `(@${nextDateStr} ${formattedRule})`;

  return {
    nextDateStr,
    nextTimeStr: timeStr,
    nextDueAtUtc,
    nextRuleStr,
    nextTokenStr,
  };
}
