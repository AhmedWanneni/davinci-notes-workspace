import type { Meta, StoryObj } from "@storybook/react";
import { SyncSettingsPanel } from "./SyncSettingsPanel";

const meta: Meta<typeof SyncSettingsPanel> = {
  title: "Components/SyncSettingsPanel",
  component: SyncSettingsPanel,
  tags: ["autodocs"],
  args: {
    vaultPath: "/Users/davinci/Documents/MyVault",
  },
};

export default meta;
type Story = StoryObj<typeof SyncSettingsPanel>;

export const NotConfigured: Story = {
  args: {
    mode: "off",
  },
};

export const DriveConnected: Story = {
  args: {
    mode: "drive",
    isDriveSignedIn: true,
    driveAccountEmail: "user@example.com",
  },
};

export const DriveDisconnected: Story = {
  args: {
    mode: "drive",
    isDriveSignedIn: false,
  },
};

export const FolderModeConfigured: Story = {
  args: {
    mode: "folder",
    vaultPath: "/Users/davinci/Documents/SyncthingVault",
  },
};
