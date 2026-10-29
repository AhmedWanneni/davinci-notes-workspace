import type { GoogleCalendarApiEvent, NormalizedCalendarEvent } from "./calendarTypes";
import { parseMeetLink } from "./parseMeetLink";

export function normalizeCalendarEvent(
  calendarId: string,
  raw: GoogleCalendarApiEvent,
): NormalizedCalendarEvent {
  const isAllDay = Boolean(raw.start?.date && !raw.start?.dateTime);
  const startIso = raw.start?.dateTime || raw.start?.date || new Date().toISOString();
  const endIso = raw.end?.dateTime || raw.end?.date || startIso;
  const status: "confirmed" | "tentative" | "cancelled" =
    raw.status === "cancelled" || raw.status === "tentative" ? raw.status : "confirmed";

  return {
    id: raw.id,
    calendarId,
    title: raw.summary?.trim() || "(No title)",
    startIso,
    endIso,
    isAllDay,
    meetUrl: parseMeetLink(raw),
    location: raw.location?.trim() || undefined,
    description: raw.description?.trim() || undefined,
    status,
    attendees: Array.isArray(raw.attendees) ? raw.attendees : [],
    updatedAt: raw.updated ? new Date(raw.updated).getTime() : Date.now(),
    etag: raw.etag?.trim() || undefined,
    recurrenceRule: Array.isArray(raw.recurrence) ? raw.recurrence.join("\n") : undefined,
    recurringEventId: raw.recurringEventId?.trim() || undefined,
    originalStartIso: raw.originalStartTime?.dateTime || raw.originalStartTime?.date || undefined,
    syncStatus: "synced",
  };
}
