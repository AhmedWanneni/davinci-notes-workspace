import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingDevicesDialog } from "./SyncthingDevicesDialog";

const meta: Meta<typeof SyncthingDevicesDialog> = {
  title: "Settings/SyncthingDevicesDialog",
  component: SyncthingDevicesDialog,
};

export default meta;
type Story = StoryObj<typeof SyncthingDevicesDialog>;

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    devices: [],
    pendingDevices: [],
    pendingFolders: [],
    sharedVaults: [],
    onUpdated: async () => {},
  },
};
