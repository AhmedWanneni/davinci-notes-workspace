import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as Clipboard from "expo-clipboard";
import { SyncthingPairedDevicesSection } from "./SyncthingPairedDevicesSection";

// @ts-expect-error react act flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn().mockResolvedValue(true),
}));

describe("SyncthingPairedDevicesSection", () => {
  const remoteDeviceId = "REMOTE-1111111-2222222-3333333-4444444-5555555-6666666-7777777";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders null when devices list is empty", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SyncthingPairedDevicesSection devices={[]} onRemoveDevice={vi.fn()} />,
      );
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders paired devices with connection status and unpair action", async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SyncthingPairedDevicesSection
          devices={[
            {
              deviceId: remoteDeviceId,
              name: "MacBook Pro",
              connected: true,
              paused: false,
              isVaultShared: true,
            },
          ]}
          onRemoveDevice={onRemove}
        />,
      );
    });

    expect(container.textContent).toContain("Paired Devices");
    expect(container.textContent).toContain("MacBook Pro");
    expect(container.textContent).toContain("Connected");
    expect(container.textContent).toContain("Vault Shared");

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const unpairBtn = buttons.find((b) => b.textContent?.includes("Unpair"));
    expect(unpairBtn).toBeDefined();

    await act(async () => {
      (unpairBtn as HTMLElement).click();
    });

    expect(onRemove).toHaveBeenCalledWith(remoteDeviceId);
  });
});
