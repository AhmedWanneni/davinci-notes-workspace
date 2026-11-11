import type { Meta, StoryObj } from "@storybook/react";
import { TodoReminderQuickPicker } from "./TodoReminderQuickPicker";

const meta: Meta<typeof TodoReminderQuickPicker> = {
  title: "Todos/TodoReminderQuickPicker",
  component: TodoReminderQuickPicker,
  args: {
    isOpen: true,
    onClose: () => {},
    onSetReminder: () => {},
    hasReminder: false,
  },
};

export default meta;
type Story = StoryObj<typeof TodoReminderQuickPicker>;

export const Default: Story = {};

export const WithExistingReminder: Story = {
  args: {
    hasReminder: true,
  },
};
