import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingSyncCheckSection } from "./SyncthingSyncCheckSection";

const meta: Meta<typeof SyncthingSyncCheckSection> = {
  title: "Settings/SyncthingSyncCheckSection",
  component: SyncthingSyncCheckSection,
};

export default meta;
type Story = StoryObj<typeof SyncthingSyncCheckSection>;

export const Default: Story = {};

export const AllChecksPassed: Story = {
  args: {
    customReport: {
      reachability: {
        passed: true,
        reason: "Syncthing v2.1.6 reachable at 127.0.0.1:8384",
      },
      remoteConnected: {
        passed: true,
        reason: "1 remote device(s) connected",
        connectedDevices: ["6IAWYVY-TEST"],
      },
      folderState: {
        passed: true,
        reason: "Folder is idle (0 out-of-sync items)",
        folderId: "test-vault",
        state: "idle",
        outOfSyncItems: 0,
        remoteCompletions: { "6IAWYVY-TEST": 100 },
      },
      folderErrors: {
        passed: true,
        reason: "No folder errors reported",
        errors: [],
      },
      selfTest: {
        passed: true,
        reason: "Synced to remote in 340ms",
        roundTripMs: 340,
      },
    },
  },
};

export const RemoteOffline: Story = {
  args: {
    customReport: {
      reachability: {
        passed: true,
        reason: "Syncthing v2.1.6 reachable at 127.0.0.1:8384",
      },
      remoteConnected: {
        passed: false,
        reason: "No remote devices connected",
        connectedDevices: [],
      },
      folderState: {
        passed: true,
        reason: "Folder is idle (0 out-of-sync items)",
        folderId: "test-vault",
        state: "idle",
        outOfSyncItems: 0,
        remoteCompletions: {},
      },
      folderErrors: {
        passed: true,
        reason: "No folder errors reported",
        errors: [],
      },
      selfTest: {
        passed: false,
        reason:
          "Skipped: no remote devices connected to verify sync round-trip",
        roundTripMs: null,
      },
    },
  },
};
