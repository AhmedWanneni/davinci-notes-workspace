import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingConnectOptions } from "./SyncthingConnectOptions";

const meta: Meta<typeof SyncthingConnectOptions> = {
  title: "Settings/SyncthingConnectOptions",
  component: SyncthingConnectOptions,
};

export default meta;
type Story = StoryObj<typeof SyncthingConnectOptions>;

export const Default: Story = {
  args: {
    mobileContent: <div>Scan this QR code with the mobile app.</div>,
    desktopContent: <div>Enter the other computer’s device ID.</div>,
  },
};
