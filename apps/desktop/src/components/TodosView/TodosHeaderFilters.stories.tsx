import type { Meta, StoryObj } from "@storybook/react";
import { TodosHeaderFilters } from "./TodosHeaderFilters";

const meta: Meta<typeof TodosHeaderFilters> = {
  title: "Todos/TodosHeaderFilters",
  component: TodosHeaderFilters,
  args: {
    viewMode: "motherboard",
    reminderFilter: "all",
    scheduledFilter: "all",
    selectedMonth: "all",
    monthsMap: new Map([["Nov", 4]]),
    statusFilter: "all",
    totalTodos: 10,
  },
};

export default meta;
type Story = StoryObj<typeof TodosHeaderFilters>;

export const Motherboard: Story = {};

export const Reminders: Story = {
  args: {
    viewMode: "reminders",
    remindersCounts: { all: 5, overdue: 1, today: 2, upcoming: 2, completed: 3 },
    onSelectReminderFilter: () => {},
  },
};

export const Scheduled: Story = {
  args: {
    viewMode: "scheduled",
    scheduledCounts: { all: 4, scheduled: 2, needsSend: 1, missed: 0, sent: 1 },
    onSelectScheduledFilter: () => {},
  },
};
