import type { GoogleCalendarApiEvent } from "./calendarTypes";

const MEET_REGEX = /https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?[^\s"'<>]*)?/i;

function sanitizeUrl(candidate?: string): string | undefined {
  if (!candidate) return undefined;
  const trimmed = candidate.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function parseMeetLink(event: GoogleCalendarApiEvent): string | undefined {
  if (event.hangoutLink) {
    const sanitized = sanitizeUrl(event.hangoutLink);
    if (sanitized) return sanitized;
  }

  const entryPoints = event.conferenceData?.entryPoints;
  if (Array.isArray(entryPoints)) {
    const videoEntry = entryPoints.find((ep) => ep.entryPointType === "video" && Boolean(ep.uri));
    if (videoEntry?.uri) {
      const sanitized = sanitizeUrl(videoEntry.uri);
      if (sanitized) return sanitized;
    }
  }

  if (event.location) {
    const match = event.location.match(MEET_REGEX);
    if (match?.[0]) {
      const sanitized = sanitizeUrl(match[0]);
      if (sanitized) return sanitized;
    }
  }

  if (event.description) {
    const match = event.description.match(MEET_REGEX);
    if (match?.[0]) {
      const sanitized = sanitizeUrl(match[0]);
      if (sanitized) return sanitized;
    }
  }

  return undefined;
}
