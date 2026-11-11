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

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText(/0 devices/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Show/ }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("No devices paired yet.")).toBeDefined();
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

    fireEvent.click(screen.getByRole("button", { name: /Show/ }));

    expect(screen.getByText("Work Laptop")).toBeDefined();
    expect(screen.getByText("Phone")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Waiting")).toBeDefined();
    expect(screen.queryByText(/Waiting for mutual authorization/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show shared vaults for Work Laptop" }));
    expect(screen.getByText("Shared vault")).toBeDefined();
    expect(screen.getByText("Share Vault")).toBeDefined();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search devices" }), { target: { value: "phone" } });
    expect(screen.getByText("Phone")).toBeDefined();
    expect(screen.queryByText("Work Laptop")).toBeNull();
  });

  it("calls syncthingRemoveDevice when the trash action is clicked", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Show/ }));

    const unpairBtn = screen.getByLabelText("Unpair Work Laptop");
    await act(async () => {
      fireEvent.click(unpairBtn);
    });

    expect(removeSpy).toHaveBeenCalledWith(
      "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
    );
  });

  it("shows a red approval count and opens automatically for pending devices", () => {
    render(
      <SyncthingPairedDevicesSection
        devices={[]}
        pendingDevices={[{
          deviceId: "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
          name: "Pending phone",
          address: "10.0.0.5:22000",
          time: "2026-10-17T16:00:00Z",
        }]}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("1 approvals needed")).toBeDefined();
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Incoming Requests")).toBeDefined();
  });
});
