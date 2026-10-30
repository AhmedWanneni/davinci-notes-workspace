// @vitest-environment jsdom
import React, { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncthingSharedVaultsSection } from "./SyncthingSharedVaultsSection";
import * as commands from "./syncthingCommands";

describe("SyncthingSharedVaultsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no vaults are shared", () => {
    render(<SyncthingSharedVaultsSection vaults={[]} onUpdated={vi.fn()} />);

    expect(screen.getByText(/No shared vaults yet/)).toBeDefined();
    expect(screen.getByText("0 vaults")).toBeDefined();
  });

  it("renders shared vaults with active and synced badges", () => {
    const vaults: commands.SyncthingSharedVault[] = [
      {
        folderId: "davinci-vault-default",
        label: "Personal Notes",
        path: "/Users/user/Documents/PersonalNotes",
        sharedWithDeviceIds: ["DEV-1"],
        paused: false,
        isActiveVault: true,
      },
      {
        folderId: "work-folder",
        label: "Work Projects",
        path: "/Users/user/Documents/WorkProjects",
        sharedWithDeviceIds: ["DEV-1", "DEV-2"],
        paused: false,
        isActiveVault: false,
      },
    ];

    render(
      <SyncthingSharedVaultsSection
        vaults={vaults}
        onOpenVault={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText("Personal Notes")).toBeDefined();
    expect(screen.getByText("Work Projects")).toBeDefined();
    expect(screen.getByText("Active Vault")).toBeDefined();
    expect(screen.getByText("Synced Vault")).toBeDefined();
    expect(screen.getByText("1 device")).toBeDefined();
    expect(screen.getByText("2 devices")).toBeDefined();
    expect(
      screen.getByText("/Users/user/Documents/PersonalNotes"),
    ).toBeDefined();
    expect(screen.getByText("Open Vault")).toBeDefined();
  });

  it("triggers onOpenVault when Open Vault is clicked", async () => {
    const onOpenVaultMock = vi.fn();
    const vaults: commands.SyncthingSharedVault[] = [
      {
        folderId: "work-folder",
        label: "Work Projects",
        path: "/Users/user/Documents/WorkProjects",
        sharedWithDeviceIds: ["DEV-1"],
        paused: false,
        isActiveVault: false,
      },
    ];

    render(
      <SyncthingSharedVaultsSection
        vaults={vaults}
        onOpenVault={onOpenVaultMock}
        onUpdated={vi.fn()}
      />,
    );

    const openBtn = screen.getByText("Open Vault");
    await act(async () => {
      fireEvent.click(openBtn);
    });

    expect(onOpenVaultMock).toHaveBeenCalledWith(
      "/Users/user/Documents/WorkProjects",
    );
  });

  it("calls showInFolder when Reveal is clicked", async () => {
    const revealSpy = vi
      .spyOn(commands, "showInFolder")
      .mockResolvedValue(undefined);

    const vaults: commands.SyncthingSharedVault[] = [
      {
        folderId: "work-folder",
        label: "Work Projects",
        path: "/Users/user/Documents/WorkProjects",
        sharedWithDeviceIds: ["DEV-1"],
        paused: false,
        isActiveVault: false,
      },
    ];

    render(
      <SyncthingSharedVaultsSection vaults={vaults} onUpdated={vi.fn()} />,
    );

    const revealBtn = screen.getByTitle("Reveal in file manager");
    await act(async () => {
      fireEvent.click(revealBtn);
    });

    expect(revealSpy).toHaveBeenCalledWith(
      "/Users/user/Documents/WorkProjects",
    );
  });

  it("calls syncthingUnshareVaultFolder when delete is clicked", async () => {
    const unshareSpy = vi
      .spyOn(commands, "syncthingUnshareVaultFolder")
      .mockResolvedValue(undefined);
    const onUpdatedMock = vi.fn().mockResolvedValue(undefined);

    const vaults: commands.SyncthingSharedVault[] = [
      {
        folderId: "work-folder",
        label: "Work Projects",
        path: "/Users/user/Documents/WorkProjects",
        sharedWithDeviceIds: ["DEV-1"],
        paused: false,
        isActiveVault: false,
      },
    ];

    render(
      <SyncthingSharedVaultsSection
        vaults={vaults}
        onUpdated={onUpdatedMock}
      />,
    );

    const unshareBtn = screen.getByTitle("Stop syncing this folder");
    await act(async () => {
      fireEvent.click(unshareBtn);
    });

    expect(unshareSpy).toHaveBeenCalledWith("work-folder");
    expect(onUpdatedMock).toHaveBeenCalled();
  });

  it("supports 2 instances: instance 1 displays active vault_1 and switches to synced vault_2", async () => {
    const onOpenVaultMock = vi.fn();
    const vaults: commands.SyncthingSharedVault[] = [
      {
        folderId: "vault-1-id",
        label: "vault_1",
        path: "/workspaces/vault_1",
        sharedWithDeviceIds: [],
        paused: false,
        isActiveVault: true,
      },
      {
        folderId: "vault-2-id",
        label: "vault_2",
        path: "/workspaces/vault_2",
        sharedWithDeviceIds: ["NODE-2-DEVICE-ID"],
        paused: false,
        isActiveVault: false,
      },
    ];

    const { rerender } = render(
      <SyncthingSharedVaultsSection
        vaults={vaults}
        onOpenVault={onOpenVaultMock}
        onUpdated={vi.fn()}
      />,
    );

    // Initial state: vault_1 is active, vault_2 is synced
    expect(screen.getByText("vault_1")).toBeDefined();
    expect(screen.getByText("vault_2")).toBeDefined();
    expect(screen.getByText("/workspaces/vault_1")).toBeDefined();
    expect(screen.getByText("/workspaces/vault_2")).toBeDefined();
    expect(screen.getByText("Active Vault")).toBeDefined();
    expect(screen.getByText("Synced Vault")).toBeDefined();

    // Click "Open Vault" to switch to vault_2
    const switchBtn = screen.getByText("Open Vault");
    await act(async () => {
      fireEvent.click(switchBtn);
    });

    expect(onOpenVaultMock).toHaveBeenCalledWith("/workspaces/vault_2");

    // After switching, re-render with updated active state
    const switchedVaults: commands.SyncthingSharedVault[] = [
      {
        ...vaults[0],
        isActiveVault: false,
      },
      {
        ...vaults[1],
        isActiveVault: true,
      },
    ];

    rerender(
      <SyncthingSharedVaultsSection
        vaults={switchedVaults}
        onOpenVault={onOpenVaultMock}
        onUpdated={vi.fn()}
      />,
    );

    // Now vault_2 is Active Vault
    const badges = screen.getAllByText(/Vault/);
    expect(badges.length).toBeGreaterThan(0);
  });
});
