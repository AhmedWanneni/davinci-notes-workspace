import type { Meta, StoryObj } from "@storybook/react";
import { TodoReminderRow } from "./TodoReminderRow";

const meta: Meta<typeof TodoReminderRow> = {
  title: "Todos/TodoReminderRow",
  component: TodoReminderRow,
  args: {
    item: {
      id: 1,
      reminderKey: "rem-1",
      notePath: "todos/Design/Admin Dashboard.md",
      line: 5,
      dueAtUtc: new Date(Date.now() + 3600000).toISOString(),
      tz: "UTC",
      text: "Review dashboard wireframes with team",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: new Date(Date.now() + 3600000).toISOString(),
      category: "today",
      channels: ["desktop", "whatsapp"],
      deliveryError: null,
    },
    onToggleDone: () => {},
    onUpdateText: () => {},
    onSnooze: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodoReminderRow>;

export const Default: Story = {};

export const Overdue: Story = {
  args: {
    item: {
      id: 2,
      reminderKey: "rem-2",
      notePath: "todos/Daily/Focus.md",
      line: 3,
      dueAtUtc: new Date(Date.now() - 7200000).toISOString(),
      tz: "UTC",
      text: "Missed morning standup preparation",
      done: false,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: new Date(Date.now() - 7200000).toISOString(),
      category: "missed",
      channels: ["desktop"],
      deliveryError: null,
    },
  },
};

export const Completed: Story = {
  args: {
    item: {
      id: 3,
      reminderKey: "rem-3",
      notePath: "todos/Daily/Focus.md",
      line: 8,
      dueAtUtc: new Date().toISOString(),
      tz: "UTC",
      text: "Finished task reminder",
      done: true,
      status: null,
      snoozeUntilUtc: null,
      effectiveDueUtc: new Date().toISOString(),
      category: "today",
      channels: ["desktop"],
      deliveryError: null,
    },
  },
};
