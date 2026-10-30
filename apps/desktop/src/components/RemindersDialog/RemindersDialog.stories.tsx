import type { Meta, StoryObj } from "@storybook/react-vite";
import { RemindersDialog } from "./RemindersDialog";

const meta: Meta<typeof RemindersDialog> = {
  title: "Components/Reminders/RemindersDialog",
  component: RemindersDialog,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onOpenChange: () => {},
    onSelectNote: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RemindersDialog>;

export const Default: Story = {};
