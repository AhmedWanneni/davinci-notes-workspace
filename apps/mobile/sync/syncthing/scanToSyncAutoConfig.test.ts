import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach } from "vitest";

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { useScanToSync } from "./useScanToSync";
import { EmbeddedSyncthingBridge } from "./embeddedSyncthingBridge";
import * as ops from "./mobileSyncthingOperations";
import * as pairing from "./mobileSyncthingPairing";

function renderHookHelper<T>(hookFn: () => T) {
  const result: { current: T } = {} as { current: T };
  const container = document.createElement("div");
  const root = createRoot(container);
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  act(() => {
    root.render(React.createElement(TestComponent));
  });
  return { result };
}

describe("ScanToSync In-App Automated Configuration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("opens directly in 'scanner' step without showing any prereqs setup guide", () => {
    const { result } = renderHookHelper(() =>
      useScanToSync(true, "not-running", false, "/mock/vault"),
    );

    expect(result.current.step).toBe("scanner");
  });

  it("automatically starts embedded Syncthing daemon when modal opens", () => {
    const mockStatus = {
      status: "running" as const,
      deviceId: "MOCK-ID",
      deviceName: "Mobile",
      port: 8384,
      uptime: 100,
    };
    vi.spyOn(EmbeddedSyncthingBridge, "isAvailable").mockReturnValue(true);
    const startSpy = vi
      .spyOn(EmbeddedSyncthingBridge, "start")
      .mockResolvedValue(mockStatus);

    renderHookHelper(() =>
      useScanToSync(true, "not-running", false, "/mock/vault"),
    );

    expect(startSpy).toHaveBeenCalled();
  });

  it("completes pairing and triggers immediate scan without manual phone steps", async () => {
    const mockStatus = {
      status: "running" as const,
      deviceId: "MOCK-ID",
      deviceName: "Mobile",
      port: 8384,
      uptime: 100,
    };
    vi.spyOn(EmbeddedSyncthingBridge, "isAvailable").mockReturnValue(true);
    vi.spyOn(EmbeddedSyncthingBridge, "start").mockResolvedValue(mockStatus);

    const setLocalNameSpy = vi
      .spyOn(ops, "mobileSyncthingSetLocalDeviceName")
      .mockResolvedValue();
    vi.spyOn(ops, "mobileSyncthingIsFolderConfigured").mockResolvedValue(false);
    const addDeviceSpy = vi
      .spyOn(pairing, "mobileSyncthingAddDevice")
      .mockResolvedValue();
    vi.spyOn(pairing, "mobileSyncthingPendingFolders").mockResolvedValue([
      {
        folderId: "vault-101",
        label: "My Notes",
        offeredBy: "DEV-ABC-123",
        time: "2026-10-18T12:00:00Z",
      },
    ]);
    const acceptFolderSpy = vi
      .spyOn(pairing, "mobileSyncthingAcceptFolder")
      .mockResolvedValue();
    const triggerScanSpy = vi
      .spyOn(ops, "mobileSyncthingTriggerScan")
      .mockResolvedValue(true);
    vi.spyOn(ops, "mobileSyncthingFolderCompletion").mockResolvedValue({
      completion: 100,
      needBytes: 0,
      globalBytes: 4096,
      needItems: 0,
    });

    const { result } = renderHookHelper(() =>
      useScanToSync(true, "running", true, "/mock/vault"),
    );

    act(() => {
      result.current.handleScanSuccess({
        v: 1,
        id: "DEV-ABC-123",
        name: "MacBook",
        folderId: "vault-101",
        folderLabel: "My Notes",
        code: "123456",
      });
    });

    expect(result.current.step).toBe("confirm");

    await act(async () => {
      await result.current.handleConfirm("/mock/vault");
    });

    expect(setLocalNameSpy).toHaveBeenCalledWith("", "Mobile-123456");
    expect(addDeviceSpy).toHaveBeenCalledWith("", "DEV-ABC-123", "MacBook");
    expect(acceptFolderSpy).toHaveBeenCalledWith("", "vault-101", "/mock/vault");
    expect(triggerScanSpy).toHaveBeenCalledWith("", "vault-101");
    expect(result.current.stage).toBe("completed");
    expect(result.current.progressPercent).toBe(100);
  });
});
