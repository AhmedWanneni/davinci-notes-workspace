import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingVaultShareSection } from "./SyncthingVaultShareSection";

const meta: Meta<typeof SyncthingVaultShareSection> = {
  title: "Settings/SyncthingVaultShareSection",
  component: SyncthingVaultShareSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SyncthingVaultShareSection>;

export const Default: Story = {
  args: {
    onShared: async () => {},
  },
};
