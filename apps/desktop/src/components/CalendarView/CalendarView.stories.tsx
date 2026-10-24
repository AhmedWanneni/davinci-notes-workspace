import type { Meta, StoryObj } from "@storybook/react";
import { CalendarLeaf } from "./CalendarLeaf";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

const mockEvents: NormalizedCalendarEvent[] = [
  {
    id: "evt-1",
    calendarId: "primary",
    title: "Quarterly Design Critique",
    startIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    endIso: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
    isAllDay: false,
    meetUrl: "https://meet.google.com/xyz-uvwx-rst",
    location: "Online / Google Meet",
    status: "confirmed",
    attendees: [
      { email: "leonardo@davinci.app", self: true },
      { email: "lorenzo@davinci.app", displayName: "Lorenzo" },
    ],
    updatedAt: Date.now(),
  },
  {
    id: "evt-2",
    calendarId: "primary",
    title: "Product Roadmap Review",
    startIso: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    endIso: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    isAllDay: false,
    meetUrl: "https://meet.google.com/abc-defg-hij",
    status: "confirmed",
    attendees: [{ email: "product@davinci.app" }],
    updatedAt: Date.now(),
  },
  {
    id: "evt-3",
    calendarId: "primary",
    title: "Sprint Retrospective",
    startIso: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    endIso: new Date(Date.now() + 27 * 3600 * 1000).toISOString(),
    isAllDay: false,
    status: "confirmed",
    attendees: [],
    updatedAt: Date.now(),
  },
];

const meta: Meta<typeof CalendarLeaf> = {
  title: "Components/CalendarView",
  component: CalendarLeaf,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CalendarLeaf>;

export const DefaultAgenda: Story = {
  args: {
    eventsOverride: mockEvents,
  },
};

export const EmptyAgenda: Story = {
  args: {
    eventsOverride: [],
  },
};
