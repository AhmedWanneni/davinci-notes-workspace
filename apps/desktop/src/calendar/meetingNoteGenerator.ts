import type {
  NormalizedCalendarEvent,
  CalendarEventAttendee,
} from "@app/google-calendar-api";

export interface MeetingNoteOptions {
  meetingsFolder?: string;
  dailyNotesFolder?: string;
}

/** Sanitize a string to be a safe filesystem file stem (no / \ : * ? " < > |). */
export function sanitizeMeetingFileName(title: string): string {
  const sanitized = title
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized.length > 0 ? sanitized : "Untitled Meeting";
}

/** Formats event start/end times into a readable range (e.g. 10:00 - 11:00 or All day). */
export function formatMeetingTimeRange(event: NormalizedCalendarEvent): string {
  if (event.isAllDay) return "All day";
  try {
    const start = new Date(event.startIso);
    const end = new Date(event.endIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startTime} - ${endTime}`;
  } catch {
    return "All day";
  }
}

/** Formats event date as YYYY-MM-DD. */
export function getMeetingDateString(event: NormalizedCalendarEvent): string {
  try {
    const d = new Date(event.startIso);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().slice(0, 10);
}

/** Formats attendee list into markdown bullets. */
export function formatAttendeesMarkdown(
  attendees?: CalendarEventAttendee[],
): string {
  if (!attendees || attendees.length === 0) {
    return "- None";
  }
  return attendees
    .map((att) => {
      if (att.displayName && att.email) {
        return `- ${att.displayName} (${att.email})`;
      }
      return `- ${att.displayName || att.email}`;
    })
    .join("\n");
}

/** Builds the relative vault note path for a meeting note. */
export function buildMeetingNotePath(
  event: NormalizedCalendarEvent,
  folder: string = "Meetings",
): string {
  const dateStr = getMeetingDateString(event);
  const safeTitle = sanitizeMeetingFileName(event.title);
  const fileName = `${dateStr} ${safeTitle}.md`;
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "").trim();
  return cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
}

/** Generates standard markdown content with YAML frontmatter for a meeting note. */
export function generateMeetingNoteMarkdown(
  event: NormalizedCalendarEvent,
  options?: MeetingNoteOptions,
): string {
  const dateStr = getMeetingDateString(event);
  const timeStr = formatMeetingTimeRange(event);
  const attendeesList = formatAttendeesMarkdown(event.attendees);
  const title = event.title.trim() || "Untitled Meeting";
  const escapedYamlTitle = title.replace(/"/g, '\\"');

  const dailyNoteTarget = options?.dailyNotesFolder
    ? `${options.dailyNotesFolder.replace(/^\/+|\/+$/g, "")}/${dateStr}`
    : dateStr;

  const meetLine = event.meetUrl
    ? `- **Meeting Link**: [Join Google Meet](${event.meetUrl})\n`
    : "";

  const meetYaml = event.meetUrl ? `meet_url: "${event.meetUrl}"\n` : "";

  return `---
title: "${escapedYamlTitle}"
date: ${dateStr}
time: "${timeStr}"
calendar_event_id: "${event.id}"
${meetYaml}tags:
  - meeting
---

# ${title}

- **Date**: [[${dailyNoteTarget}|${dateStr}]] ${timeStr}
${meetLine}- **Attendees**:
${attendeesList}

## Agenda

## Discussion & Notes

## Action Items
- [ ] 
`;
}

/** Checks whether a note for the specified calendar event id already exists. */
export function isEventNoteMatch(content: string, eventId: string): boolean {
  const targetPattern = new RegExp(
    `calendar_event_id:\\s*["']?${escapeRegex(eventId)}["']?`,
    "m",
  );
  return targetPattern.test(content);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Appends a meeting link under the ## Meetings section of daily note content. */
export function linkMeetingInDailyNote(
  dailyNoteContent: string,
  meetingPath: string,
  meetingTitle: string,
): string {
  const wikilink = `[[${meetingPath.replace(/\.md$/i, "")}|${meetingTitle}]]`;
  if (dailyNoteContent.includes(wikilink)) {
    return dailyNoteContent; // Already linked
  }

  const meetingsHeaderRegex = /^(##\s+Meetings\s*)$/m;
  const match = meetingsHeaderRegex.exec(dailyNoteContent);
  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    return (
      dailyNoteContent.slice(0, insertPos) +
      `\n- ${wikilink}` +
      dailyNoteContent.slice(insertPos)
    );
  }

  // Header not found; append section to end
  const trimmed = dailyNoteContent.trimEnd();
  return `${trimmed}\n\n## Meetings\n- ${wikilink}\n`;
}
