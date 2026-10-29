import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

const CONFERENCE_URL_REGEX =
  /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:meet\.google\.com|zoom\.us\/j|teams\.microsoft\.com\/l\/meetup-join)[^\s"'>]+/i;

export function extractConferenceUrl(
  event: NormalizedCalendarEvent,
): string | null {
  if (event.meetUrl && event.meetUrl.trim()) {
    return event.meetUrl.trim();
  }
  if (event.location && CONFERENCE_URL_REGEX.test(event.location)) {
    const match = event.location.match(CONFERENCE_URL_REGEX);
    return match ? match[0] : null;
  }
  if (event.description && CONFERENCE_URL_REGEX.test(event.description)) {
    const match = event.description.match(CONFERENCE_URL_REGEX);
    return match ? match[0] : null;
  }
  return null;
}

export function hasConferenceUrl(event: NormalizedCalendarEvent): boolean {
  return extractConferenceUrl(event) !== null;
}

export function isEventImminentOrActive(
  event: NormalizedCalendarEvent,
  now = Date.now(),
  windowMinutes = 5,
): boolean {
  if (event.isAllDay || event.status === "cancelled") {
    return false;
  }

  const startMs = new Date(event.startIso).getTime();
  const endMs = new Date(event.endIso).getTime();
  const leadMs = windowMinutes * 60 * 1000;

  // Between (start - leadWindow) and end
  return now >= startMs - leadMs && now <= endMs;
}

export function findActiveMeetingCandidate(
  events: NormalizedCalendarEvent[],
  dismissedIds: Set<string>,
  now = Date.now(),
): NormalizedCalendarEvent | null {
  for (const event of events) {
    if (dismissedIds.has(event.id)) {
      continue;
    }
    if (hasConferenceUrl(event) && isEventImminentOrActive(event, now)) {
      return event;
    }
  }
  return null;
}
