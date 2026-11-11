import { WEEKDAY_NAMES, type LocalScheduleSpec } from "./scheduleTime";

export interface ScheduleDraft {
  title: string;
  prompt: string;
  spec: LocalScheduleSpec;
  emoji?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const PART_OF_DAY: Record<string, string> = {
  morning: "08:00",
  noon: "12:00",
  afternoon: "14:00",
  evening: "19:00",
  night: "21:00",
  tonight: "21:00",
};

function parseTime(text: string): string | null {
  const m = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    ?? text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (m) {
    let h = parseInt(m[1], 10) % 24;
    const min = m[2] ? parseInt(m[2], 10) % 60 : 0;
    const suffix = m[3]?.toLowerCase();
    if (suffix === "pm" && h < 12) h += 12;
    if (suffix === "am" && h === 12) h = 0;
    return `${pad(h)}:${pad(min)}`;
  }
  for (const [word, time] of Object.entries(PART_OF_DAY)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return time;
  }
  return null;
}

/** Short title from the first clause of the prompt (max 6 words). */
export function deriveTitle(text: string): string {
  const cleaned = text
    .replace(/\b(every|each)\s+(day|morning|evening|night|week|month|hour|\w+day)\b,?/gi, "")
    .replace(/\b(daily|weekly|monthly|hourly)\b,?/gi, "")
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
    .replace(/^[\s,.:;-]+/, "");
  const clause = cleaned.split(/[.,;:!?\n]/)[0]?.trim() || text.trim();
  const words = clause.split(/\s+/).slice(0, 6).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1) || "Scheduled task";
}

/**
 * Best-effort extraction of a schedule from a free-text request such as
 * "Every Friday at 7pm pick three movies". The result is always shown to the
 * user for confirmation, so it only needs to be a sensible starting point.
 */
export function parseScheduleIntent(text: string): ScheduleDraft {
  const prompt = text.trim();
  const lower = prompt.toLowerCase();
  const time = parseTime(lower) ?? "08:00";
  const spec: LocalScheduleSpec = {
    frequency: "daily",
    time,
    dayOfWeek: 1,
    intervalHours: 24,
  };

  const dayIdx = WEEKDAY_NAMES.findIndex((d) =>
    new RegExp(`\\b${d.toLowerCase()}s?\\b`).test(lower),
  );
  const hourly = lower.match(/\bevery\s+(\d+)\s+hours?\b/);

  if (hourly) {
    spec.frequency = "interval";
    spec.intervalHours = Math.max(1, parseInt(hourly[1], 10));
  } else if (/\b(every hour|hourly)\b/.test(lower)) {
    spec.frequency = "interval";
    spec.intervalHours = 1;
  } else if (/\b(every month|monthly|each month)\b/.test(lower)) {
    spec.frequency = "interval";
    spec.intervalHours = 720;
  } else if (dayIdx >= 0) {
    spec.frequency = "weekly";
    spec.dayOfWeek = dayIdx;
  } else if (/\b(every week|weekly|each week)\b/.test(lower)) {
    spec.frequency = "weekly";
    spec.dayOfWeek = 1;
  }

  return { title: deriveTitle(prompt), prompt, spec };
}
