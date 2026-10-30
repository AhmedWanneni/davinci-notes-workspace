// @vitest-environment jsdom
import React, { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncthingPairedDevicesSection } from "./SyncthingPairedDevicesSection";
import * as commands from "./syncthingCommands";

describe("SyncthingPairedDevicesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no devices are configured", () => {
    render(<SyncthingPairedDevicesSection devices={[]} onUpdated={vi.fn()} />);

    expect(screen.getByText(/No remote devices paired yet/)).toBeDefined();
    expect(screen.getByText("0 devices")).toBeDefined();
  });

  it("renders configured devices with connection and vault badges", () => {
    const devices: commands.SyncthingConfiguredDevice[] = [
      {
        deviceId:
          "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
        name: "Work Laptop",
        connected: true,
        paused: false,
        address: "192.168.1.100:22000",
        isVaultShared: true,
      },
      {
        deviceId:
          "V67XP5T-QT5K64R-TBBRCAH-VCLAVAQ-KPEKJBN-B5L4K5G-IX4X2U4-XXDXVQB",
        name: "Phone",
        connected: false,
        paused: false,
        isVaultShared: false,
      },
    ];

    render(
      <SyncthingPairedDevicesSection devices={devices} onUpdated={vi.fn()} />,
    );

    expect(screen.getByText("Work Laptop")).toBeDefined();
    expect(screen.getByText("Phone")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getByText("Vault Shared")).toBeDefined();
    expect(screen.getByText("Share Vault")).toBeDefined();
    expect(
      screen.getByText(/Waiting for mutual authorization or discovery/),
    ).toBeDefined();
  });

  it("calls syncthingRemoveDevice when Unpair is clicked", async () => {
    const removeSpy = vi
      .spyOn(commands, "syncthingRemoveDevice")
      .mockResolvedValue(undefined);
    const onUpdatedMock = vi.fn().mockResolvedValue(undefined);

    const devices: commands.SyncthingConfiguredDevice[] = [
      {
        deviceId:
          "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
        name: "Work Laptop",
        connected: true,
        paused: false,
        isVaultShared: true,
      },
    ];

    render(
      <SyncthingPairedDevicesSection
        devices={devices}
        onUpdated={onUpdatedMock}
      />,
    );

    const unpairBtn = screen.getByLabelText("Unpair Work Laptop");
    await act(async () => {
      fireEvent.click(unpairBtn);
    });

    expect(removeSpy).toHaveBeenCalledWith(
      "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
    );
  });
});
