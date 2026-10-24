import { formatDate } from "./formatDate.js";
import { DEFAULT_DAILY_NOTE_FORMAT, normalizeNoteName } from "./noteName.js";

/**
 * Daily-note target for the `daily-append` / `daily-prepend` behaviours.
 * Date formatting is our own (no dayjs); the resulting path is sanitized by
 * `normalizeNoteName`.
 */
export function resolveDailyNotePath(
  date: Date,
  format: string = DEFAULT_DAILY_NOTE_FORMAT,
): string {
  return normalizeNoteName(formatDate(date, format));
}
