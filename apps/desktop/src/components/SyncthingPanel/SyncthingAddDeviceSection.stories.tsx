import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingAddDeviceSection } from "./SyncthingAddDeviceSection";

const meta: Meta<typeof SyncthingAddDeviceSection> = {
  title: "Settings/SyncthingAddDeviceSection",
  component: SyncthingAddDeviceSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SyncthingAddDeviceSection>;

export const Default: Story = {
  args: {
    onAdded: async () => {},
  },
};
