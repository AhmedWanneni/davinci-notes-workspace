// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import * as commands from "./syncthingCommands";

vi.mock("./syncthingCommands", () => ({
  syncthingAcceptDevice: vi.fn().mockResolvedValue(undefined),
  syncthingDismissPendingDevice: vi.fn().mockResolvedValue(undefined),
  syncthingShareVaultFolder: vi.fn().mockResolvedValue("davinci-123"),
  syncthingAcceptFolder: vi.fn().mockResolvedValue(undefined),
}));

describe("SyncthingPendingSection", () => {
  const mockDevId =
    "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG";
  const mockDevName = "Galaxy Phone (482910)";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no pending devices or folders", () => {
    const { container } = render(
      <SyncthingPendingSection
        pendingDevices={[]}
        pendingFolders={[]}
        onUpdated={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("highlights one-tap accept when device name carries active pairing code", async () => {
    const onUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <SyncthingPendingSection
        pendingDevices={[
          {
            deviceId: mockDevId,
            name: mockDevName,
            address: "10.0.0.5:22000",
            time: "2026-10-17T16:00:00Z",
          },
        ]}
        pendingFolders={[]}
        activePairingCode="482910"
        isPairingExpired={false}
        onUpdated={onUpdated}
      />,
    );

    expect(screen.getByText("Code verified (482910)")).toBeDefined();
    const acceptBtn = screen.getByRole("button", {
      name: `Accept device ${mockDevName}`,
    });
    expect(acceptBtn.textContent).toContain("Accept & Share");

    fireEvent.click(acceptBtn);
    await waitFor(() => {
      expect(commands.syncthingAcceptDevice).toHaveBeenCalledWith(mockDevId);
      expect(commands.syncthingShareVaultFolder).toHaveBeenCalledWith(
        mockDevId,
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("shows warning and requires explicit confirm when device code is missing or wrong", async () => {
    const onUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <SyncthingPendingSection
        pendingDevices={[
          {
            deviceId: mockDevId,
            name: "Unknown Pixel",
            address: "10.0.0.5:22000",
            time: "2026-10-17T16:00:00Z",
          },
        ]}
        pendingFolders={[]}
        activePairingCode="482910"
        isPairingExpired={false}
        onUpdated={onUpdated}
      />,
    );

    expect(screen.getByText("Unverified code")).toBeDefined();
    expect(
      screen.getByText("Device name does not contain the active pairing code."),
    ).toBeDefined();

    const acceptBtn = screen.getByRole("button", {
      name: "Accept device Unknown Pixel",
    });
    fireEvent.click(acceptBtn);

    expect(commands.syncthingAcceptDevice).not.toHaveBeenCalled();
    expect(screen.getByText("Accept unverified device?")).toBeDefined();

    const confirmBtn = screen.getByRole("button", {
      name: "Confirm accept Unknown Pixel",
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(commands.syncthingAcceptDevice).toHaveBeenCalledWith(mockDevId);
      expect(commands.syncthingShareVaultFolder).toHaveBeenCalledWith(
        mockDevId,
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("shows expired warning and does not highlight when pairing window is expired", () => {
    render(
      <SyncthingPendingSection
        pendingDevices={[
          {
            deviceId: mockDevId,
            name: mockDevName,
            address: "10.0.0.5:22000",
            time: "2026-10-17T16:00:00Z",
          },
        ]}
        pendingFolders={[]}
        activePairingCode="482910"
        isPairingExpired={true}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText("Pairing window expired")).toBeDefined();
    const acceptBtn = screen.getByRole("button", {
      name: `Accept device ${mockDevName}`,
    });
    expect(acceptBtn.textContent).toContain("Accept");
  });

  it("declines a device request without sharing vault or adding device", async () => {
    const onUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <SyncthingPendingSection
        pendingDevices={[
          {
            deviceId: mockDevId,
            name: mockDevName,
            address: "10.0.0.5:22000",
            time: "2026-10-17T16:00:00Z",
          },
        ]}
        pendingFolders={[]}
        activePairingCode="482910"
        isPairingExpired={false}
        onUpdated={onUpdated}
      />,
    );

    const ignoreBtn = screen.getByRole("button", {
      name: `Ignore device ${mockDevName}`,
    });
    fireEvent.click(ignoreBtn);

    await waitFor(() => {
      expect(commands.syncthingDismissPendingDevice).toHaveBeenCalledWith(
        mockDevId,
      );
      expect(commands.syncthingAcceptDevice).not.toHaveBeenCalled();
      expect(commands.syncthingShareVaultFolder).not.toHaveBeenCalled();
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("renders pending folder offer and accepts it with target path", async () => {
    const onUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <SyncthingPendingSection
        pendingDevices={[]}
        pendingFolders={[
          {
            folderId: "davinci-c130e8cee8",
            label: "Obsidian Vault",
            offeredBy: mockDevId,
            time: "2026-10-30T23:26:00Z",
          },
        ]}
        onUpdated={onUpdated}
      />,
    );

    expect(screen.getByText("Obsidian Vault")).toBeDefined();
    const input = screen.getByLabelText("Target Destination Path:");
    fireEvent.change(input, { target: { value: "/Users/test/Vault" } });

    const acceptBtn = screen.getByRole("button", {
      name: "Accept Folder Offer",
    });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(commands.syncthingAcceptFolder).toHaveBeenCalledWith(
        "davinci-c130e8cee8",
        "/Users/test/Vault",
        false,
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });
});
