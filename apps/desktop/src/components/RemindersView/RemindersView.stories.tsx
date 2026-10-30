import type { Meta, StoryObj } from "@storybook/react";
import { RemindersView } from "./RemindersView";

const meta: Meta<typeof RemindersView> = {
  title: "Views/RemindersView",
  component: RemindersView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onOpenNote: () => {},
    onOpenSettings: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RemindersView>;

export const Default: Story = {};
