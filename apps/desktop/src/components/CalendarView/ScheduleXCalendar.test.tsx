// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { ScheduleXCalendar } from "./ScheduleXCalendar";

const mockEvents: NormalizedCalendarEvent[] = [
  {
    id: "evt-1",
    calendarId: "primary",
    title: "Architecture Review",
    startIso: "2026-10-27T10:00:00Z",
    endIso: "2026-10-27T11:00:00Z",
    isAllDay: false,
    status: "confirmed",
    attendees: [],
    updatedAt: 1729851000000,
  },
  {
    id: "evt-2",
    calendarId: "primary",
    title: "All Day Workshop",
    startIso: "2026-10-28",
    endIso: "2026-10-29",
    isAllDay: true,
    status: "confirmed",
    attendees: [],
    updatedAt: 1729851000000,
  },
];

describe("ScheduleXCalendar", () => {
  it("renders the Schedule-X wrapper container", () => {
    render(
      <ScheduleXCalendar
        events={mockEvents}
        selectedDate="2026-10-27"
        view="month-grid"
      />,
    );

    const container = screen.getByTestId("schedule-x-calendar");
    expect(container).toBeDefined();
  });

  it("renders with week and day views without crashing", () => {
    const onSelectEvent = vi.fn();
    const { rerender } = render(
      <ScheduleXCalendar
        events={mockEvents}
        selectedDate="2026-10-27"
        view="week"
        onSelectEvent={onSelectEvent}
      />,
    );

    expect(screen.getByTestId("schedule-x-calendar")).toBeDefined();

    rerender(
      <ScheduleXCalendar
        events={mockEvents}
        selectedDate="2026-10-27"
        view="day"
        onSelectEvent={onSelectEvent}
      />,
    );

    expect(screen.getByTestId("schedule-x-calendar")).toBeDefined();
  });
});
