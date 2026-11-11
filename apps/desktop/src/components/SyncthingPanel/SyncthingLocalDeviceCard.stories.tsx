import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingLocalDeviceCard } from "./SyncthingLocalDeviceCard";

const meta: Meta<typeof SyncthingLocalDeviceCard> = {
  title: "Settings/SyncthingLocalDeviceCard",
  component: SyncthingLocalDeviceCard,
};

export default meta;
type Story = StoryObj<typeof SyncthingLocalDeviceCard>;

export const Default: Story = {
  args: {
    deviceId: "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
    deviceName: "Ahmed’s MacBook",
    autoStart: true,
    setAutoStart: () => {},
    onUpdated: async () => {},
  },
};
