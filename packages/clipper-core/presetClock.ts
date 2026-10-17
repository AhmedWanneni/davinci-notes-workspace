import { formatDate } from "./formatDate.js";

/**
 * The clock-derived preset variables (`date`, `time`).
 *
 * `clipper-core` does not invent a `now`: the caller passes one in, so a clip is
 * reproducible. The extension builds its preset map with `buildPresetClock(now)`
 * for bare `{{date}}` / `{{time}}`, while `{{date|date:"…"}}` needs no preset at
 * all because the `date` filter falls back to the runtime clock.
 */
export function toLocalIso(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${datePart}T${timePart}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function buildPresetClock(now: Date): { date: string; time: string } {
  return { date: toLocalIso(now), time: formatDate(now, "HH:mm") };
}
