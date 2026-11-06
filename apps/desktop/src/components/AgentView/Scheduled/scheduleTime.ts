import type { ScheduleRecurrence } from "@app/ai-agent";

/** Frequency choices exposed in the UI (local-time based). */
export type ScheduleFrequency = "daily" | "weekly" | "interval";

/** A schedule as the user thinks about it: in local wall-clock time. */
export interface LocalScheduleSpec {
  frequency: ScheduleFrequency;
  /** "HH:mm" in the user's local timezone (daily / weekly). */
  time: string;
  /** 0 = Sunday … 6 = Saturday, local day (weekly only). */
  dayOfWeek: number;
  /** Hours between runs (interval only). */
  intervalHours: number;
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const pad = (n: number) => String(n).padStart(2, "0");

function parseHHmm(time: string): [number, number] {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10) || 0);
  return [Math.min(23, Math.max(0, h)), Math.min(59, Math.max(0, m))];
}

/** Converts a local-time spec into the UTC recurrence the engine stores. */
export function toUtcRecurrence(
  spec: LocalScheduleSpec,
  now: Date = new Date(),
): ScheduleRecurrence {
  if (spec.frequency === "interval") {
    return { type: "interval", intervalHours: Math.max(1, spec.intervalHours) };
  }
  const [h, m] = parseHHmm(spec.time);
  const local = new Date(now);
  local.setHours(h, m, 0, 0);
  if (spec.frequency === "weekly") {
    local.setDate(local.getDate() + ((spec.dayOfWeek - local.getDay() + 7) % 7));
  }
  const timeUtc = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  if (spec.frequency === "weekly") {
    return { type: "weekly", dayOfWeek: local.getUTCDay(), timeUtc };
  }
  return { type: "daily", timeUtc };
}

/** Converts a stored UTC recurrence back into a local-time spec. */
export function toLocalSpec(
  recurrence: ScheduleRecurrence,
  now: Date = new Date(),
): LocalScheduleSpec {
  if (recurrence.type === "interval") {
    return {
      frequency: "interval",
      time: "08:00",
      dayOfWeek: 1,
      intervalHours: recurrence.intervalHours,
    };
  }
  const [h, m] = parseHHmm(recurrence.timeUtc);
  const d = new Date(now);
  d.setUTCHours(h, m, 0, 0);
  if (recurrence.type === "weekly") {
    d.setUTCDate(d.getUTCDate() + ((recurrence.dayOfWeek - d.getUTCDay() + 7) % 7));
  }
  return {
    frequency: recurrence.type,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    dayOfWeek: d.getDay(),
    intervalHours: 24,
  };
}

/** "8:00 AM" style formatting of an "HH:mm" local time. */
export function formatClockTime(time: string): string {
  const [h, m] = parseHHmm(time);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`;
}

/** Human description, e.g. "Every day at 8:00 AM". */
export function describeRecurrence(recurrence: ScheduleRecurrence): string {
  const spec = toLocalSpec(recurrence);
  if (spec.frequency === "interval") {
    const hours = spec.intervalHours;
    if (hours === 1) return "Every hour";
    if (hours % 24 === 0) {
      const days = hours / 24;
      return days === 1 ? "Every day" : `Every ${days} days`;
    }
    return `Every ${hours} hours`;
  }
  const at = formatClockTime(spec.time);
  if (spec.frequency === "weekly") {
    return `Every ${WEEKDAY_NAMES[spec.dayOfWeek]} at ${at}`;
  }
  return `Every day at ${at}`;
}

/** Relative label for the next run: "Today 8:00 AM", "Tomorrow …", "Fri, Nov 6 …". */
export function describeNextRun(iso: string, now: Date = new Date()): string {
  const next = new Date(iso);
  if (isNaN(next.getTime())) return "";
  const time = formatClockTime(`${next.getHours()}:${next.getMinutes()}`);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(next) - startOfDay(now)) / 86_400_000);
  if (days <= 0) return `Today ${time}`;
  if (days === 1) return `Tomorrow ${time}`;
  const date = next.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} ${time}`;
}
