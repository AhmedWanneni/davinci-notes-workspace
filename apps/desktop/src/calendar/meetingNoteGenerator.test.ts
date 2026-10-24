import { describe, expect, it } from "vitest";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import {
  sanitizeMeetingFileName,
  formatMeetingTimeRange,
  getMeetingDateString,
  formatAttendeesMarkdown,
  buildMeetingNotePath,
  generateMeetingNoteMarkdown,
  isEventNoteMatch,
  linkMeetingInDailyNote,
} from "./meetingNoteGenerator";

const sampleEvent: NormalizedCalendarEvent = {
  id: "evt-gcal-12345",
  calendarId: "primary",
  title: "Sprint Planning / Design Sync: Q4?",
  startIso: "2026-10-20T10:00:00.000Z",
  endIso: "2026-10-20T11:00:00.000Z",
  isAllDay: false,
  meetUrl: "https://meet.google.com/abc-defg-hij",
  location: "Google Meet",
  status: "confirmed",
  attendees: [
    { displayName: "Alice Smith", email: "alice@example.com" },
    { email: "bob@example.com" },
  ],
  updatedAt: 1729418400000,
};

describe("meetingNoteGenerator", () => {
  it("sanitizes filenames stripping forbidden characters", () => {
    expect(sanitizeMeetingFileName("Sprint Planning / Design Sync: Q4?")).toBe(
      "Sprint Planning - Design Sync- Q4-",
    );
    expect(sanitizeMeetingFileName('Bad "Chars" <Here> | *')).toBe(
      "Bad -Chars- -Here- - -",
    );
    expect(sanitizeMeetingFileName("   ")).toBe("Untitled Meeting");
  });

  it("formats meeting time ranges correctly", () => {
    expect(formatMeetingTimeRange({ ...sampleEvent, isAllDay: true })).toBe(
      "All day",
    );
    const range = formatMeetingTimeRange(sampleEvent);
    expect(range).toMatch(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
  });

  it("extracts meeting date string", () => {
    expect(getMeetingDateString(sampleEvent)).toBe("2026-10-20");
  });

  it("formats attendee list into markdown bullets", () => {
    const formatted = formatAttendeesMarkdown(sampleEvent.attendees);
    expect(formatted).toContain("- Alice Smith (alice@example.com)");
    expect(formatted).toContain("- bob@example.com");

    expect(formatAttendeesMarkdown([])).toBe("- None");
    expect(formatAttendeesMarkdown(undefined)).toBe("- None");
  });

  it("builds correct relative meeting note paths", () => {
    const path = buildMeetingNotePath(sampleEvent, "Meetings");
    expect(path).toBe("Meetings/2026-10-20 Sprint Planning - Design Sync- Q4-.md");

    const rootPath = buildMeetingNotePath(sampleEvent, "");
    expect(rootPath).toBe("2026-10-20 Sprint Planning - Design Sync- Q4-.md");
  });

  it("generates markdown with valid YAML frontmatter and backlinks", () => {
    const md = generateMeetingNoteMarkdown(sampleEvent, {
      meetingsFolder: "Meetings",
      dailyNotesFolder: "Daily Notes",
    });

    expect(md).toContain('calendar_event_id: "evt-gcal-12345"');
    expect(md).toContain('meet_url: "https://meet.google.com/abc-defg-hij"');
    expect(md).toContain("- meeting");
    expect(md).toContain("# Sprint Planning / Design Sync: Q4?");
    expect(md).toContain("[[Daily Notes/2026-10-20|2026-10-20]]");
    expect(md).toContain("[Join Google Meet](https://meet.google.com/abc-defg-hij)");
    expect(md).toContain("## Agenda");
    expect(md).toContain("## Discussion & Notes");
    expect(md).toContain("## Action Items");
    expect(md).toContain("- [ ]");
  });

  it("detects existing meeting note frontmatter match for idempotency", () => {
    const md = generateMeetingNoteMarkdown(sampleEvent);
    expect(isEventNoteMatch(md, "evt-gcal-12345")).toBe(true);
    expect(isEventNoteMatch(md, "other-event-id")).toBe(false);
  });

  it("links meeting note in daily note with or without existing section", () => {
    const dailyInitial = `# 2026-10-20\n\nDaily log notes here.`;
    const updated = linkMeetingInDailyNote(
      dailyInitial,
      "Meetings/2026-10-20 Sprint Planning.md",
      "Sprint Planning",
    );
    expect(updated).toContain("## Meetings\n- [[Meetings/2026-10-20 Sprint Planning|Sprint Planning]]");

    // Second append to existing ## Meetings section
    const existingSection = `# 2026-10-20\n\n## Meetings\n- [[Meetings/Other Meeting|Other]]\n\nNotes.`;
    const secondUpdate = linkMeetingInDailyNote(
      existingSection,
      "Meetings/2026-10-20 Sprint Planning.md",
      "Sprint Planning",
    );
    expect(secondUpdate).toContain("## Meetings\n- [[Meetings/2026-10-20 Sprint Planning|Sprint Planning]]\n- [[Meetings/Other Meeting|Other]]");

    // Idempotent: linking again does not duplicate
    const thirdUpdate = linkMeetingInDailyNote(
      secondUpdate,
      "Meetings/2026-10-20 Sprint Planning.md",
      "Sprint Planning",
    );
    expect(thirdUpdate).toBe(secondUpdate);
  });
});
