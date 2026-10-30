import type { Meta, StoryObj } from "@storybook/react";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { ScheduleXCalendar } from "./ScheduleXCalendar";

const mockEvents: NormalizedCalendarEvent[] = [
  {
    id: "evt-1",
    calendarId: "primary",
    title: "Architecture Review",
    startIso: "2026-10-27T10:00:00Z",
    endIso: "2026-10-27T11:30:00Z",
    isAllDay: false,
    status: "confirmed",
    attendees: [],
    updatedAt: 1729851000000,
    location: "Google Meet",
  },
  {
    id: "evt-2",
    calendarId: "primary",
    title: "Company All-Hands",
    startIso: "2026-10-28",
    endIso: "2026-10-29",
    isAllDay: true,
    status: "confirmed",
    attendees: [],
    updatedAt: 1729851000000,
  },
];

const meta: Meta<typeof ScheduleXCalendar> = {
  title: "CalendarView/ScheduleXCalendar",
  component: ScheduleXCalendar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleXCalendar>;

export const MonthGridView: Story = {
  args: {
    events: mockEvents,
    selectedDate: "2026-10-27",
    view: "month-grid",
  },
};

export const WeekView: Story = {
  args: {
    events: mockEvents,
    selectedDate: "2026-10-27",
    view: "week",
  },
};

export const DayView: Story = {
  args: {
    events: mockEvents,
    selectedDate: "2026-10-27",
    view: "day",
  },
};

export const MonthAgendaView: Story = {
  args: {
    events: mockEvents,
    selectedDate: "2026-10-27",
    view: "month-agenda",
  },
};
