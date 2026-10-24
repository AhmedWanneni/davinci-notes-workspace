import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach } from "vitest";

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { SyncSettingsPanel } from "./SyncSettingsPanel";
import * as syncthing from "./syncthing";

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

describe("SyncSettingsPanel Sync Now button behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Sync Now button is enabled by default even when Google Drive is unauthenticated", async () => {
    vi.mocked(syncthing.mobileSyncthingDetect).mockResolvedValue({
      running: false,
      version: "",
      guiAddress: "127.0.0.1",
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(SyncSettingsPanel));
    });

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const syncButton = buttons.find((b) => b.textContent?.includes("Sync Now"));
    expect(syncButton).toBeDefined();
    expect((syncButton as HTMLButtonElement).disabled ?? false).toBe(false);
  });

  it("triggers Syncthing scan when Syncthing daemon is running and re-enables after sync", async () => {
    vi.mocked(syncthing.mobileSyncthingDetect).mockResolvedValue({
      running: true,
      version: "v2.1.6",
      guiAddress: "127.0.0.1:8384",
    });
    vi.mocked(syncthing.getSyncthingApiKey).mockResolvedValue("mock-key");
    const scanSpy = vi.mocked(syncthing.mobileSyncthingTriggerScan).mockResolvedValue(true);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(SyncSettingsPanel));
    });

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const syncButton = buttons.find((b) => b.textContent?.includes("Sync Now"));
    expect(syncButton).toBeDefined();

    await act(async () => {
      syncButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(scanSpy).toHaveBeenCalledWith("mock-key");
    expect(container.textContent).toContain("Sync Now");
  });

  it("shows friendly guide message when neither Drive nor Syncthing is active", async () => {
    vi.mocked(syncthing.mobileSyncthingDetect).mockResolvedValue({
      running: false,
      version: "",
      guiAddress: "127.0.0.1",
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(SyncSettingsPanel));
    });

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const syncButton = buttons.find((b) => b.textContent?.includes("Sync Now"));

    await act(async () => {
      syncButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Connect Google Drive or start Syncthing");
  });
});
