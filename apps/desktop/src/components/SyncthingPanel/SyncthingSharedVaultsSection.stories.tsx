import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingSharedVaultsSection } from "./SyncthingSharedVaultsSection";

const meta: Meta<typeof SyncthingSharedVaultsSection> = {
  title: "Settings/SyncthingSharedVaultsSection",
  component: SyncthingSharedVaultsSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SyncthingSharedVaultsSection>;

export const Empty: Story = {
  args: {
    vaults: [],
    onOpenVault: () => {},
    onUpdated: async () => {},
  },
};

export const WithVaults: Story = {
  args: {
    vaults: [
      {
        folderId: "davinci-vault-default",
        label: "Personal Notes",
        path: "/Users/user/Documents/PersonalNotes",
        sharedWithDeviceIds: [
          "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
        ],
        paused: false,
        isActiveVault: true,
      },
      {
        folderId: "folder-work-archive",
        label: "Work Projects",
        path: "/Users/user/Documents/WorkProjects",
        sharedWithDeviceIds: [
          "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
          "V67XP5T-QT5K64R-TBBRCAH-VCLAVAQ-KPEKJBN-B5L4K5G-IX4X2U4-XXDXVQB",
        ],
        paused: false,
        isActiveVault: false,
      },
    ],
    onOpenVault: () => {},
    onUpdated: async () => {},
  },
};
