import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReminderRowItem } from "./ReminderRowItem";

const meta = {
  title: "Components/Reminders/ReminderRowItem",
  component: ReminderRowItem,
  args: {
    item: {
      id: 1,
      reminderKey: "key-1",
      notePath: "Projects/Roadmap.md",
      line: 14,
      dueAtUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
      tz: "UTC",
      text: "Finalize Phase 4 deliverables",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
      category: "today",
    },
    onNavigate: () => {},
    onToggleDone: () => {},
    onSnooze: () => {},
  },
} satisfies Meta<typeof ReminderRowItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpcomingToday: Story = {};

export const Overdue: Story = {
  args: {
    item: {
      id: 2,
      reminderKey: "key-2",
      notePath: "Inbox/Quick Notes.md",
      line: 4,
      dueAtUtc: new Date(Date.now() - 7200 * 1000).toISOString(),
      tz: "UTC",
      text: "Review customer feedback",
      done: false,
      status: "missed",
      snoozeUntilUtc: null,
      effectiveDueUtc: new Date(Date.now() - 7200 * 1000).toISOString(),
      category: "missed",
    },
  },
};

export const Snoozed: Story = {
  args: {
    item: {
      id: 3,
      reminderKey: "key-3",
      notePath: "Work/Sprint.md",
      line: 22,
      dueAtUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
      tz: "UTC",
      text: "Call vendor regarding contract renewal",
      done: false,
      status: "snoozed",
      snoozeUntilUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
      effectiveDueUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
      category: "today",
    },
  },
};
