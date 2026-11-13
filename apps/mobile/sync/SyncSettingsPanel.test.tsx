import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach } from "vitest";

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { SyncSettingsPanel } from "./SyncSettingsPanel";
import { defaultSecureTokenStore } from "./secureTokenStore";

vi.mock("./syncthing", () => ({
  MobileSyncthingPanel: () => React.createElement("div", { "data-testid": "syncthing-panel" }),
  mobileSyncthingDetect: vi.fn(),
  mobileSyncthingTriggerScan: vi.fn(),
  getSyncthingApiKey: vi.fn(),
}));

vi.mock("./secureTokenStore", () => ({
  defaultSecureTokenStore: {
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("./mobileDriveAuth", () => ({
  loginWithDriveNativeSession: vi.fn(),
}));

describe("SyncSettingsPanel dynamic connection behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows 'Connect with Google Drive' and does not show 'Sync Now' when unauthenticated", async () => {
    vi.mocked(defaultSecureTokenStore.load).mockResolvedValue(null);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(SyncSettingsPanel));
    });

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const connectButton = buttons.find((b) => b.textContent?.includes("Connect with Google Drive"));
    const syncButton = buttons.find((b) => b.textContent?.includes("Sync Now"));

    expect(connectButton).toBeDefined();
    expect(syncButton).toBeUndefined();
    expect(container.textContent).not.toContain("Sync Settings");
    expect(container.textContent).not.toContain("Status");
  });

  it("shows 'Sync Now' and does not show 'Connect with Google Drive' when authenticated", async () => {
    vi.mocked(defaultSecureTokenStore.load).mockResolvedValue({
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      expiresAt: Date.now() + 3600000,
      scope: "drive.file",
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(SyncSettingsPanel));
    });

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const syncButton = buttons.find((b) => b.textContent?.includes("Sync Now"));
    const connectButton = buttons.find((b) => b.textContent?.includes("Connect with Google Drive"));

    expect(syncButton).toBeDefined();
    expect(connectButton).toBeUndefined();
  });
});
