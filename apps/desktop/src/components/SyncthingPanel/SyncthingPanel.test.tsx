// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncthingPanel } from "./SyncthingPanel";
import type { SyncthingStatusState } from "./useSyncthingStatus";

describe("SyncthingPanel Component", () => {
  const baseStatus: SyncthingStatusState = {
    status: "running",
    version: "v2.1.6",
    guiAddress: "127.0.0.1:8384",
    deviceId: "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
    deviceName: "My MacBook",
    uptime: 120,
    qrDataUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    pendingDevices: [],
    pendingFolders: [],
    errorMessage: null,
    isLoading: false,
    refresh: vi.fn(),
  };

  it("renders Running state with device info and QR code", () => {
    render(<SyncthingPanel customStatus={baseStatus} />);

    expect(screen.getByText("Running")).toBeDefined();
    expect(
      screen.getByText(/Syncthing is active on 127.0.0.1:8384/),
    ).toBeDefined();
    expect(screen.getByText("My MacBook")).toBeDefined();
    expect(
      screen.getByText(
        "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
      ),
    ).toBeDefined();

    const qrImage = screen.getByTestId("syncthing-qr-image");
    expect(qrImage).toBeDefined();
    expect(qrImage.getAttribute("src")).toBe(baseStatus.qrDataUrl);
  });

  it("renders Add Device and Share Vault sections when running", () => {
    render(<SyncthingPanel customStatus={baseStatus} />);
    expect(screen.getByText("Add Remote Device")).toBeDefined();
    expect(screen.getByText("Share Active Vault")).toBeDefined();
  });

  it("renders incoming pending devices and folders when present", () => {
    const withPending: SyncthingStatusState = {
      ...baseStatus,
      pendingDevices: [
        {
          deviceId:
            "AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG-HHHHHHH",
          name: "Phone Peer",
          address: "192.168.1.100:22000",
          time: "2026-10-17T16:00:00Z",
        },
      ],
      pendingFolders: [
        {
          folderId: "vault-offer-1",
          label: "Team Notes",
          offeredBy:
            "AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG-HHHHHHH",
          time: "2026-10-17T16:05:00Z",
        },
      ],
    };

    render(<SyncthingPanel customStatus={withPending} />);
    expect(screen.getByText("Incoming Requests")).toBeDefined();
    expect(screen.getByText("Phone Peer")).toBeDefined();
    expect(screen.getByText("Team Notes")).toBeDefined();
    expect(screen.getByText("Accept")).toBeDefined();
    expect(screen.getByText("Ignore")).toBeDefined();
    expect(screen.getByText("Accept Folder Offer")).toBeDefined();
  });

  it("renders Not running state with fix hint", () => {
    const notRunningStatus: SyncthingStatusState = {
      ...baseStatus,
      status: "not-running",
      qrDataUrl: null,
    };

    render(<SyncthingPanel customStatus={notRunningStatus} />);

    expect(screen.getByText("Not running")).toBeDefined();
    expect(
      screen.getByText(
        "Start Syncthing from your terminal or application launcher to enable sync.",
      ),
    ).toBeDefined();
    expect(screen.queryByTestId("syncthing-qr-image")).toBeNull();
  });

  it("renders Not installed state with fix hint", () => {
    const notInstalledStatus: SyncthingStatusState = {
      ...baseStatus,
      status: "not-installed",
      deviceId: "",
      qrDataUrl: null,
    };

    render(<SyncthingPanel customStatus={notInstalledStatus} />);

    expect(screen.getByText("Not installed")).toBeDefined();
    expect(
      screen.getByText(
        "Install Syncthing from syncthing.net or via your package manager.",
      ),
    ).toBeDefined();
  });

  it("renders Key problem state with fix hint", () => {
    const badKeyStatus: SyncthingStatusState = {
      ...baseStatus,
      status: "bad-key",
      qrDataUrl: null,
    };

    render(<SyncthingPanel customStatus={badKeyStatus} />);

    expect(screen.getByText("Key problem")).toBeDefined();
    expect(
      screen.getByText(
        "Check your API key in Syncthing GUI (Settings → General → API Key).",
      ),
    ).toBeDefined();
  });

  it("copies device ID to clipboard and shows feedback", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<SyncthingPanel customStatus={baseStatus} />);

    const copyBtn = screen.getByLabelText("Copy Device ID");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(baseStatus.deviceId);

    await waitFor(() => {
      expect(screen.getByText(/Copied!/)).toBeDefined();
    });
  });

  it("calls refresh when clicking the Refresh button", () => {
    const refreshMock = vi.fn();
    render(
      <SyncthingPanel
        customStatus={{
          ...baseStatus,
          refresh: refreshMock,
        }}
      />,
    );

    const refreshBtn = screen.getByLabelText("Refresh Syncthing status");
    fireEvent.click(refreshBtn);

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
