import type { Meta, StoryObj } from "@storybook/react";
import { CalendarEmptyState } from "./CalendarEmptyState";

const meta: Meta<typeof CalendarEmptyState> = {
  title: "CalendarView/CalendarEmptyState",
  component: CalendarEmptyState,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CalendarEmptyState>;

export const Default: Story = {
  args: {
    isConnecting: false,
    onConnect: () => {},
    onOpenSettings: () => {},
  },
};

export const Connecting: Story = {
  args: {
    isConnecting: true,
    onConnect: () => {},
    onOpenSettings: () => {},
  },
};
