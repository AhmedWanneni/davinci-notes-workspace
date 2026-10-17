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

export const WithOffers: Story = {
  args: {
    pendingDevices: [
      {
        deviceId:
          "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
        name: "Remote Laptop",
        address: "192.168.1.15:22000",
        time: "2026-10-17T15:30:00Z",
      },
    ],
    pendingFolders: [
      {
        folderId: "vault-offer-42",
        label: "Research Notes",
        offeredBy:
          "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
        time: "2026-10-17T15:35:00Z",
      },
    ],
    onUpdated: async () => {},
  },
};
