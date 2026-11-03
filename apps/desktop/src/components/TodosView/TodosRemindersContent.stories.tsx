import type { Meta, StoryObj } from "@storybook/react";
import { TodosRemindersContent } from "./TodosRemindersContent";

const meta: Meta<typeof TodosRemindersContent> = {
  title: "Todos/TodosRemindersContent",
  component: TodosRemindersContent,
  args: {
    reminders: [
      {
        id: 1,
        reminderKey: "rem-1",
        notePath: "todos/Design/Dashboard.md",
        line: 5,
        dueAtUtc: new Date(Date.now() - 3600000).toISOString(),
        tz: "UTC",
        text: "Overdue design critique",
        done: false,
        status: null,
        snoozeUntilUtc: null,
        effectiveDueUtc: new Date(Date.now() - 3600000).toISOString(),
        category: "missed",
        channels: ["desktop"],
        deliveryError: null,
      },
      {
        id: 2,
        reminderKey: "rem-2",
        notePath: "todos/Daily/Focus.md",
        line: 10,
        dueAtUtc: new Date().toISOString(),
        tz: "UTC",
        text: "Submit weekly progress report",
        done: false,
        status: null,
        snoozeUntilUtc: null,
        effectiveDueUtc: new Date().toISOString(),
        category: "today",
        channels: ["desktop", "whatsapp"],
        deliveryError: null,
      },
    ],
    searchQuery: "",
    filter: "all",
    onToggleDone: () => {},
    onUpdateText: () => {},
    onSnooze: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onOpenFullModal: () => {},
    onAddQuickReminder: async () => {},
    availableNotes: ["todos/Daily/Focus.md", "todos/Design/Dashboard.md"],
  },
};

export default meta;
type Story = StoryObj<typeof TodosRemindersContent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    reminders: [],
  },
};
