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
    configuredDevices: [],
    pendingDevices: [],
    pendingFolders: [],
    sharedVaults: [],
    errorMessage: null,
    lastLogs: null,
    isLoading: false,
    autoStart: false,
    setAutoStart: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    refresh: vi.fn(),
  };

  const basePairing = {
    pairingCode: "482910",
    pairingPayload: {
      v: 1 as const,
      id: "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
      name: "My MacBook",
      folderId: "davinci-123",
      folderLabel: "Vault",
      code: "482910",
    },
    qrDataUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    secondsLeft: 280,
    isExpired: false,
    isGenerating: false,
    rotateCode: vi.fn(),
  };

  it("renders Running state with raw device ID, Stop button, and pairing QR code", () => {
    const stopMock = vi.fn();
    render(
      <SyncthingPanel
        customStatus={{ ...baseStatus, stop: stopMock }}
        customPairing={basePairing}
      />,
    );

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

    const stopBtn = screen.getByLabelText("Stop Syncthing");
    expect(stopBtn).toBeDefined();
    fireEvent.click(stopBtn);
    expect(stopMock).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("syncthing-qr-image")).toBeDefined();
    expect(screen.getByText("Waiting for phone...")).toBeDefined();
    expect(screen.getByTestId("pairing-code").textContent).toContain(
      "Code: 482 910",
    );
  });

  it("renders Stopped state with Start button and no terminal message", () => {
    const startMock = vi.fn();
    const stoppedStatus: SyncthingStatusState = {
      ...baseStatus,
      status: "stopped",
      deviceId: "",
      qrDataUrl: null,
      start: startMock,
    };

    render(<SyncthingPanel customStatus={stoppedStatus} />);

    expect(screen.getByText("Stopped")).toBeDefined();
    expect(screen.queryByText(/Start Syncthing from your terminal/)).toBeNull();
    expect(screen.getByText(/Click Start to begin/)).toBeDefined();

    const startBtn = screen.getByLabelText("Start Syncthing");
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("renders Crashed state with Retry button and process logs", () => {
    const startMock = vi.fn();
    const crashedStatus: SyncthingStatusState = {
      ...baseStatus,
      status: "crashed",
      errorMessage: "Process exited with code 1",
      lastLogs: ["[main] failed to start listener", "[main] exiting"],
      start: startMock,
    };

    render(<SyncthingPanel customStatus={crashedStatus} />);

    expect(screen.getByText("Crashed")).toBeDefined();
    expect(screen.getByText("Process exited with code 1")).toBeDefined();
    expect(screen.getByTestId("syncthing-logs")).toBeDefined();
    expect(screen.getByText(/failed to start listener/)).toBeDefined();

    const retryBtn = screen.getByLabelText("Retry Start");
    fireEvent.click(retryBtn);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("toggles auto-start preference", () => {
    const setAutoStartMock = vi.fn();
    render(
      <SyncthingPanel
        customStatus={{
          ...baseStatus,
          autoStart: false,
          setAutoStart: setAutoStartMock,
        }}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(setAutoStartMock).toHaveBeenCalledWith(true);
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

  it("renders paired devices and switches between Phone and Computer pairing tabs", () => {
    const customWithDevices: SyncthingStatusState = {
      ...baseStatus,
      configuredDevices: [
        {
          deviceId:
            "ARJZ7MZ-ZPVJ4XL-6IIAEOV-2LZQZOR-2RBFRXI-62QV5WS-Y32WHPD-TWOP4QR",
          name: "Work Laptop",
          connected: true,
          paused: false,
          address: "192.168.1.100:22000",
          isVaultShared: true,
        },
      ],
    };

    render(
      <SyncthingPanel
        customStatus={customWithDevices}
        customPairing={basePairing}
      />,
    );

    // Paired devices should be visible
    expect(screen.getByText("Work Laptop")).toBeDefined();
    expect(screen.getByText("Vault Shared")).toBeDefined();

    // Default tab is Phone (QR Code)
    expect(screen.getByTestId("syncthing-qr-image")).toBeDefined();

    // Switch to Connect Computer
    const computerTab = screen.getByText("Connect Computer (Device ID)");
    fireEvent.click(computerTab);

    // Add device form should be visible
    expect(screen.getByTestId("syncthing-add-device")).toBeDefined();
    expect(screen.queryByTestId("syncthing-qr-image")).toBeNull();
  });
});
