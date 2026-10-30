import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingPairedDevicesSection } from "./SyncthingPairedDevicesSection";

const meta: Meta<typeof SyncthingPairedDevicesSection> = {
  title: "Settings/SyncthingPairedDevicesSection",
  component: SyncthingPairedDevicesSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SyncthingPairedDevicesSection>;

export const Empty: Story = {
  args: {
    devices: [],
    onUpdated: async () => {},
  },
};

export const WithDevices: Story = {
  args: {
    devices: [
      {
        deviceId:
          "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
        name: "Work Laptop",
        connected: true,
        paused: false,
        address: "192.168.1.100:22000",
        isVaultShared: true,
      },
      {
        deviceId:
          "V67XP5T-QT5K64R-TBBRCAH-VCLAVAQ-KPEKJBN-B5L4K5G-IX4X2U4-XXDXVQB",
        name: "Ahmed Phone",
        connected: false,
        paused: false,
        isVaultShared: false,
      },
    ],
    onUpdated: async () => {},
  },
};
