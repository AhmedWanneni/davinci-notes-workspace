import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SyncthingSharedVaultsSection } from "./SyncthingSharedVaultsSection";

// @ts-expect-error react act flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SyncthingSharedVaultsSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders null when vaults list is empty", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SyncthingSharedVaultsSection
          vaults={[]}
          onOpenVault={vi.fn()}
          onUnshareVault={vi.fn()}
        />,
      );
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders shared vaults with active status and Open Vault button for synced vault", async () => {
    const onOpen = vi.fn().mockResolvedValue(undefined);
    const onUnshare = vi.fn().mockResolvedValue(undefined);
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SyncthingSharedVaultsSection
          vaults={[
            {
              folderId: "vault-1",
              label: "Personal Notes",
              path: "/storage/emulated/0/Personal",
              sharedWithDeviceIds: ["dev-1"],
              paused: false,
              isActiveVault: true,
            },
            {
              folderId: "vault-2",
              label: "Work Notes",
              path: "/storage/emulated/0/Work",
              sharedWithDeviceIds: ["dev-1", "dev-2"],
              paused: false,
              isActiveVault: false,
            },
          ]}
          onOpenVault={onOpen}
          onUnshareVault={onUnshare}
        />,
      );
    });

    expect(container.textContent).toContain("Shared Vaults & Folders");
    expect(container.textContent).toContain("Personal Notes");
    expect(container.textContent).toContain("Active Vault");
    expect(container.textContent).toContain("Work Notes");
    expect(container.textContent).toContain("Synced Vault");

    const buttons = Array.from(container.querySelectorAll("div[role=button], button"));
    const openBtn = buttons.find((b) => b.textContent?.includes("Open Vault"));
    expect(openBtn).toBeDefined();

    await act(async () => {
      (openBtn as HTMLElement).click();
    });

    expect(onOpen).toHaveBeenCalledWith("/storage/emulated/0/Work", "Work Notes");
  });
});
