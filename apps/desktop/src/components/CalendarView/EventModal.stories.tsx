import type { Meta, StoryObj } from "@storybook/react";
import { EventModal } from "./EventModal";

const meta: Meta<typeof EventModal> = {
  title: "CalendarView/EventModal",
  component: EventModal,
};

export default meta;
type Story = StoryObj<typeof EventModal>;

export const NewEvent: Story = {
  args: {
    isOpen: true,
    initialDate: "2026-04-16",
    calendars: [
      { id: "primary", summary: "Personal", primary: true },
      { id: "work", summary: "Engineering Team" },
    ],
    onClose: () => {},
    onSave: () => {},
  },
};

export const EditRecurringEvent: Story = {
  args: {
    isOpen: true,
    event: {
      id: "evt_1",
      calendarId: "primary",
      title: "Weekly Architecture Sync",
      description: "Review ADRs and migration plans",
      location: "Google Meet",
      startIso: "2026-04-16T14:00:00.000Z",
      endIso: "2026-04-16T15:00:00.000Z",
      isAllDay: false,
      status: "confirmed",
      htmlLink: "https://calendar.google.com",
      meetUrl: "https://meet.google.com/xyz-abcd-efg",
      attendees: [],
      organizerEmail: "lead@example.com",
      etag: '"123"',
      syncStatus: "synced",
      recurringEventId: "series_99",
      updatedAt: "2026-04-16T08:00:00.000Z",
    },
    onClose: () => {},
    onSave: () => {},
    onDelete: () => {},
    onJoinMeet: () => {},
    onCreateNote: () => {},
  },
};
