import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingPanel } from "./SyncthingPanel";

const meta: Meta<typeof SyncthingPanel> = {
  title: "Settings/SyncthingPanel",
  component: SyncthingPanel,
};

export default meta;
type Story = StoryObj<typeof SyncthingPanel>;

export const Running: Story = {
  args: {
    customStatus: {
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
      refresh: async () => {},
    },
  },
};

export const NotRunning: Story = {
  args: {
    customStatus: {
      status: "not-running",
      version: "",
      guiAddress: "127.0.0.1:8384",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: "Connection refused",
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
      refresh: async () => {},
    },
  },
};

export const NotInstalled: Story = {
  args: {
    customStatus: {
      status: "not-installed",
      version: "",
      guiAddress: "",
      deviceId: "",
      deviceName: "",
      uptime: 0,
      qrDataUrl: null,
      errorMessage: "config.xml not found",
      isLoading: false,
      pendingDevices: [],
      pendingFolders: [],
      refresh: async () => {},
    },
  },
};

export const KeyProblem: Story = {
  args: {
    customStatus: {
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
      refresh: async () => {},
    },
  },
};
