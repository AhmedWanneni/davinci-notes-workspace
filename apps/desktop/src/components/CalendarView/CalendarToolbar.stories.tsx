import type { Meta, StoryObj } from "@storybook/react";
import { CalendarToolbar } from "./CalendarToolbar";

const meta: Meta<typeof CalendarToolbar> = {
  title: "CalendarView/CalendarToolbar",
  component: CalendarToolbar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CalendarToolbar>;

export const Default: Story = {
  args: {
    currentView: "month-grid",
    periodLabel: "October 2026",
    isSyncing: false,
    onViewChange: () => {},
    onToday: () => {},
    onPrev: () => {},
    onNext: () => {},
    onCreateEvent: () => {},
    onSync: () => {},
    onOpenSettings: () => {},
    onClose: () => {},
  },
};

export const SyncingWeekView: Story = {
  args: {
    ...Default.args,
    currentView: "week",
    periodLabel: "Oct 25 – 31, 2026",
    isSyncing: true,
  },
};
