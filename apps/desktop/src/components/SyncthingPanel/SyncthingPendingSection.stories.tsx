import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingPendingSection } from "./SyncthingPendingSection";

const meta: Meta<typeof SyncthingPendingSection> = {
  title: "Settings/SyncthingPendingSection",
  component: SyncthingPendingSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SyncthingPendingSection>;

export const VerifiedCode: Story = {
  args: {
    pendingDevices: [
      {
        deviceId:
          "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
        name: "Pixel 8 (482910)",
        address: "192.168.1.15:22000",
        time: "2026-10-18T15:30:00Z",
      },
    ],
    pendingFolders: [],
    activePairingCode: "482910",
    isPairingExpired: false,
    onUpdated: async () => {},
  },
};

export const UnverifiedCode: Story = {
  args: {
    pendingDevices: [
      {
        deviceId:
          "DEV2-XXXXXXX-YYYYYYY-ZZZZZZZ-1111111-2222222-3333333-4444444",
        name: "Unknown iPhone",
        address: "192.168.1.20:22000",
        time: "2026-10-18T15:32:00Z",
      },
    ],
    pendingFolders: [],
    activePairingCode: "482910",
    isPairingExpired: false,
    onUpdated: async () => {},
  },
};

export const ExpiredWindow: Story = {
  args: {
    pendingDevices: [
      {
        deviceId:
          "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
        name: "Pixel 8 (482910)",
        address: "192.168.1.15:22000",
        time: "2026-10-18T15:30:00Z",
      },
    ],
    pendingFolders: [],
    activePairingCode: "482910",
    isPairingExpired: true,
    onUpdated: async () => {},
  },
};
