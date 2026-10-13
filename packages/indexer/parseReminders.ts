export interface ParsedReminder {
  line: number;
  dueAtUtc: string;
  tz: string;
  text: string;
  done: boolean;
}

export interface ParseRemindersOptions {
  tz?: string;
  defaultTime?: string;
  lineOffset?: number;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?\r?\n)---(?:\r?\n|$)/;
const FENCED_CODE_PATTERN = /(```|~~~)[\s\S]*?\1/g;
const INLINE_CODE_PATTERN = /`[^`\r\n]+`/g;
const TASK_LINE_PATTERN =
  /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[([- xX])\][ \t]*(.*)$/;
const REMINDER_TOKEN_PATTERN =
  /\(@(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?(?:[ \t]+([A-Za-z0-9_/+:-]+))?\)/g;

function isValidDate(year: number, month: number, day: number): boolean {
  if (
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function isValidTime(hour: number, minute: number, second: number): boolean {
  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59
  );
}

function localToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): string | null {
  try {
    const utcDate = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    );
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(utcDate);
    const getPart = (type: string) => {
      const p = parts.find((pt) => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    const asYear = getPart("year");
    const asMonth = getPart("month");
    const asDay = getPart("day");
    let asHour = getPart("hour");
    if (asHour === 24) asHour = 0;
    const asMin = getPart("minute");
    const asSec = getPart("second");
    const asTzUtc = Date.UTC(asYear, asMonth - 1, asDay, asHour, asMin, asSec);
    const diff = utcDate.getTime() - asTzUtc;
    return new Date(utcDate.getTime() + diff).toISOString();
  } catch {
    return null;
  }
}

function maskIgnoredRegions(content: string): string {
  let masked = content.replace(FRONTMATTER_PATTERN, (match) =>
    match.replace(/[^\r\n]/g, " "),
  );
  masked = masked.replace(FENCED_CODE_PATTERN, (match) =>
    match.replace(/[^\r\n]/g, " "),
  );
  return masked.replace(INLINE_CODE_PATTERN, (match) =>
    " ".repeat(match.length),
  );
}

/**
 * Parse inline reminders from Markdown content.
 * Reminders attach to checklist items and ignore code blocks and frontmatter.
 */
export function parseReminders(
  content: string,
  options?: ParseRemindersOptions,
): ParsedReminder[] {
  if (content.indexOf("(@") === -1) {
    return [];
  }

  const defaultTime = options?.defaultTime ?? "09:00";
  const systemTz =
    options?.tz ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC") ??
    "UTC";
  const lineOffset = options?.lineOffset ?? 0;

  const masked = maskIgnoredRegions(content);
  const originalLines = content.split(/\r?\n/);
  const maskedLines = masked.split(/\r?\n/);

  const reminders: ParsedReminder[] = [];

  for (let i = 0; i < maskedLines.length; i++) {
    const maskedLine = maskedLines[i];
    if (!maskedLine || maskedLine.indexOf("(@") === -1) {
      continue;
    }

    const taskMatch = TASK_LINE_PATTERN.exec(maskedLine);
    if (!taskMatch) {
      continue;
    }

    const originalLine = originalLines[i] ?? maskedLine;
    const origTaskMatch = TASK_LINE_PATTERN.exec(originalLine);
    const rawBody = origTaskMatch ? origTaskMatch[2] : taskMatch[2];
    const done = taskMatch[1].toLowerCase() === "x" || taskMatch[1] === "-";

    REMINDER_TOKEN_PATTERN.lastIndex = 0;
    const tokenMatch = REMINDER_TOKEN_PATTERN.exec(taskMatch[2]);
    if (!tokenMatch) {
      continue;
    }

    const dateStr = tokenMatch[1];
    const timeStr = tokenMatch[2] ?? defaultTime;
    const explicitTz = tokenMatch[3];

    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (!isValidDate(year, month, day)) {
      continue;
    }

    const timeParts = timeStr.split(":");
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

    if (!isValidTime(hour, minute, second)) {
      continue;
    }

    const targetTz = explicitTz ?? systemTz;
    let dueAtUtc: string | null = null;

    if (explicitTz && /^[+-]\d{2}(?::?\d{2})?$|^Z$/i.test(explicitTz)) {
      try {
        const offset = explicitTz.toUpperCase() === "Z" ? "Z" : explicitTz;
        const normalizedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
        dueAtUtc = new Date(
          `${dateStr}T${normalizedTime}${offset}`,
        ).toISOString();
      } catch {
        dueAtUtc = null;
      }
    } else {
      dueAtUtc = localToUtcIso(
        year,
        month,
        day,
        hour,
        minute,
        second,
        targetTz,
      );
      if (!dueAtUtc) {
        dueAtUtc = new Date(
          Date.UTC(year, month - 1, day, hour, minute, second),
        ).toISOString();
      }
    }

    if (!dueAtUtc) {
      continue;
    }

    const cleanText = rawBody
      .replace(tokenMatch[0], "")
      .replace(/\s+/g, " ")
      .trim();

    reminders.push({
      line: i + 1 + lineOffset,
      dueAtUtc,
      tz: targetTz,
      text: cleanText,
      done,
    });
  }

  return reminders;
}
