import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingPanel } from "./SyncthingPanel";

const meta: Meta<typeof SyncthingPanel> = {
  title: "Settings/SyncthingPanel",
  component: SyncthingPanel,
};

export default meta;
type Story = StoryObj<typeof SyncthingPanel>;

const baseActions = {
  autoStart: false,
  setAutoStart: () => {},
  start: async () => {},
  stop: async () => {},
  restart: async () => {},
  refresh: async () => {},
  lastLogs: null,
  configuredDevices: [],
  sharedVaults: [],
};

export const Running: Story = {
  args: {
    customStatus: {
      ...baseActions,
      status: "running",
      version: "v2.1.6",
      guiAddress: "127.0.0.1:8384",
      deviceId:
        "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
      deviceName: "AhmedWaannenis-MacBook-Pro.local",
      uptime: 3600,
      qrDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      errorMessage: null,
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
    },
  },
};

export const Stopped: Story = {
  args: {
    customStatus: {
      ...baseActions,
      status: "stopped",
      version: "",
      guiAddress: "127.0.0.1:8384",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: null,
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
    },
  },
};

export const Crashed: Story = {
  args: {
    customStatus: {
      ...baseActions,
      status: "crashed",
      version: "v2.1.6",
      guiAddress: "127.0.0.1:8384",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: "Process exited with code 1",
      lastLogs: [
        "[main] Syncthing v2.1.6 starting",
        "[main] Fatal error: port 8384 already in use",
        "[main] Exiting with code 1",
      ],
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
    },
  },
};

export const NotInstalled: Story = {
  args: {
    customStatus: {
      ...baseActions,
      status: "not-installed",
      version: "",
      guiAddress: "",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: "binary not found",
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
    },
  },
};

export const KeyProblem: Story = {
  args: {
    customStatus: {
      ...baseActions,
      status: "bad-key",
      version: "v2.1.6",
      guiAddress: "127.0.0.1:8384",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: "CSRF / 403 Forbidden",
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
    },
  },
};
