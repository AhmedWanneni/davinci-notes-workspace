import type { Meta, StoryObj } from "@storybook/react";
import { SyncStatusButton } from "./SyncStatusButton";

const meta: Meta<typeof SyncStatusButton> = {
  title: "Components/SyncStatusButton",
  component: SyncStatusButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SyncStatusButton>;

export const Synced: Story = {
  args: {
    syncMode: "drive",
    isDriveSignedIn: true,
    isDriveSyncing: false,
    syncError: null,
  },
};

export const Syncing: Story = {
  args: {
    syncMode: "drive",
    isDriveSignedIn: true,
    isDriveSyncing: true,
    syncError: null,
  },
};

export const NotSyncedError: Story = {
  args: {
    syncMode: "drive",
    isDriveSignedIn: true,
    isDriveSyncing: false,
    syncError: "Network timeout",
  },
};

export const Disconnected: Story = {
  args: {
    syncMode: "drive",
    isDriveSignedIn: false,
    isDriveSyncing: false,
    syncError: null,
  },
};
