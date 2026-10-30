// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeetJoinButton } from "./MeetJoinButton";
import { EventCard } from "./EventCard";
import { DayAgendaView } from "./DayAgendaView";
import { CalendarLeaf } from "./CalendarLeaf";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const sampleEvent: NormalizedCalendarEvent = {
  id: "evt-test-1",
  calendarId: "primary",
  title: "Team Standup",
  startIso: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  endIso: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  isAllDay: false,
  meetUrl: "https://meet.google.com/test-meet-url",
  location: "Online",
  status: "confirmed",
  attendees: [{ email: "alice@example.com" }, { email: "bob@example.com" }],
  updatedAt: Date.now(),
};

describe("CalendarView Components", () => {
  it("MeetJoinButton triggers onJoin callback with url", () => {
    const onJoin = vi.fn();
    render(<MeetJoinButton meetUrl="https://meet.google.com/test-meet-url" onJoin={onJoin} />);

    const btn = screen.getByTestId("meet-join-btn");
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onJoin).toHaveBeenCalledWith("https://meet.google.com/test-meet-url");
  });

  it("EventCard renders event title, attendees, and triggers onCreateNote", () => {
    const onJoinMeet = vi.fn();
    const onCreateNote = vi.fn();

    render(
      <EventCard event={sampleEvent} onJoinMeet={onJoinMeet} onCreateNote={onCreateNote} />,
    );

    expect(screen.getByText("Team Standup")).toBeDefined();
    expect(screen.getByText("2 attendees")).toBeDefined();
    expect(screen.getByText("Online")).toBeDefined();

    const noteBtn = screen.getByTestId("create-note-btn-evt-test-1");
    fireEvent.click(noteBtn);
    expect(onCreateNote).toHaveBeenCalledWith(sampleEvent);
  });

  it("DayAgendaView groups happening now, today, and renders empty state", () => {
    const { rerender } = render(<DayAgendaView events={[sampleEvent]} />);
    expect(screen.getByTestId("agenda-section-now")).toBeDefined();

    rerender(<DayAgendaView events={[]} />);
    expect(screen.getByTestId("agenda-empty")).toBeDefined();
  });

  it("CalendarLeaf renders header and sync actions", async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <CalendarLeaf
        eventsOverride={[sampleEvent]}
        onSync={onSync}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Calendar & Meetings")).toBeDefined();
    const syncBtn = screen.getByTestId("calendar-sync-btn");
    fireEvent.click(syncBtn);
    expect(onSync).toHaveBeenCalled();
  });

  it("CalendarLeaf displays connection banner and triggers onConnect when not connected", () => {
    const onConnect = vi.fn();
    render(
      <CalendarLeaf
        eventsOverride={[sampleEvent]}
        isConnectedOverride={false}
        onConnect={onConnect}
      />,
    );

    expect(screen.getByTestId("calendar-connect-banner")).toBeDefined();
    const connectBtn = screen.getByTestId("calendar-connect-btn");
    expect(connectBtn.textContent).toBe("Connect Google Calendar");
    fireEvent.click(connectBtn);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});
