import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { createNoteInVault } from "../vault/createNoteInVault";
import { writeNote } from "../vault/vaultCommands";
import { createOrOpenMeetingNote } from "./createMeetingNote";

vi.mock("../vault/createNoteInVault", () => ({
  createNoteInVault: vi.fn(),
}));

vi.mock("../vault/vaultCommands", () => ({
  readNote: vi.fn(),
  writeNote: vi.fn(),
}));

const mockEvent: NormalizedCalendarEvent = {
  id: "evt-meeting-test-99",
  calendarId: "primary",
  title: "Design Critique",
  startIso: "2026-10-21T14:00:00.000Z",
  endIso: "2026-10-21T15:00:00.000Z",
  isAllDay: false,
  meetUrl: "https://meet.google.com/critic-123",
  location: "Online",
  status: "confirmed",
  attendees: [{ email: "designer@example.com" }],
  updatedAt: Date.now(),
};

describe("createOrOpenMeetingNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      allNotePaths: [],
      notesContent: {},
      isCalendarOpen: true,
    });
  });

  it("opens existing note from notesContent if calendar_event_id matches (idempotency)", async () => {
    const existingPath = "Meetings/2026-10-21 Design Critique.md";
    useWorkspaceStore.setState({
      allNotePaths: [existingPath],
      notesContent: {
        [existingPath]: `---
title: "Design Critique"
calendar_event_id: "evt-meeting-test-99"
---
# Content`,
      },
      isCalendarOpen: true,
    });

    const openNoteSpy = vi.fn();
    useWorkspaceStore.setState({ openNote: openNoteSpy });

    const resultPath = await createOrOpenMeetingNote(mockEvent);

    expect(resultPath).toBe(existingPath);
    expect(openNoteSpy).toHaveBeenCalledWith(existingPath);
    expect(useWorkspaceStore.getState().isCalendarOpen).toBe(false);
    expect(createNoteInVault).not.toHaveBeenCalled();
  });

  it("creates a new meeting note and cross-links with existing daily note", async () => {
    const dailyPath = "2026-10-21.md";
    useWorkspaceStore.setState({
      allNotePaths: [dailyPath],
      notesContent: {
        [dailyPath]: "# Daily Log 2026-10-21\n\nMorning tasks.",
      },
      isCalendarOpen: true,
    });

    const openNoteSpy = vi.fn();
    useWorkspaceStore.setState({ openNote: openNoteSpy });

    const resultPath = await createOrOpenMeetingNote(mockEvent, {
      meetingsFolder: "Meetings",
    });

    expect(resultPath).toBe("Meetings/2026-10-21 Design Critique.md");
    expect(createNoteInVault).toHaveBeenCalledWith(
      "Meetings/2026-10-21 Design Critique.md",
      expect.stringContaining('calendar_event_id: "evt-meeting-test-99"'),
    );
    expect(writeNote).toHaveBeenCalledWith(
      dailyPath,
      expect.stringContaining("## Meetings\n- [[Meetings/2026-10-21 Design Critique|Design Critique]]"),
    );
    expect(openNoteSpy).toHaveBeenCalledWith("Meetings/2026-10-21 Design Critique.md");
    expect(useWorkspaceStore.getState().isCalendarOpen).toBe(false);
  });

  it("resolves colliding filenames by appending incremental suffix", async () => {
    const existingDifferentMeeting = "Meetings/2026-10-21 Design Critique.md";
    useWorkspaceStore.setState({
      allNotePaths: [existingDifferentMeeting],
      notesContent: {
        [existingDifferentMeeting]: `---
calendar_event_id: "different-event"
---`,
      },
      isCalendarOpen: true,
    });

    const openNoteSpy = vi.fn();
    useWorkspaceStore.setState({ openNote: openNoteSpy });

    const resultPath = await createOrOpenMeetingNote(mockEvent, {
      meetingsFolder: "Meetings",
    });

    expect(resultPath).toBe("Meetings/2026-10-21 Design Critique (1).md");
    expect(createNoteInVault).toHaveBeenCalledWith(
      "Meetings/2026-10-21 Design Critique (1).md",
      expect.any(String),
    );
  });
});
